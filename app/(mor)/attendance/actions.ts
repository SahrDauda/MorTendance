"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { EventType } from "@prisma/client"

interface AttendanceRecord {
    memberId: string
    isPresent: boolean
    isLate?: boolean
}

interface SaveAttendanceParams {
    groupId?: string
    cbsLocationId?: string
    branchId?: string
    type: EventType
    date: Date
    records: AttendanceRecord[]
    notes?: string
    cutoffTime?: string
}

export async function saveAttendanceAction({ groupId, cbsLocationId, branchId, type, date, records, notes, cutoffTime }: SaveAttendanceParams) {
    const session = await auth()
    if (!session) throw new Error("Unauthorized")

    try {
        // 1. Ensure we have a branchId
        let effectiveBranchId = branchId
        if (!effectiveBranchId) {
            if (groupId) {
                const group = await db.ministryGroup.findUnique({
                    where: { id: groupId },
                    select: { branchId: true }
                })
                effectiveBranchId = group?.branchId || undefined
            } else if (cbsLocationId) {
                const location = await db.cBSLocation.findUnique({
                    where: { id: cbsLocationId },
                    select: { branchId: true }
                })
                effectiveBranchId = location?.branchId || undefined
            } else if (type === EventType.LEADERSHIP_MEETING) {
                // For Leadership Meeting, get branch from recorder's managed branch or use first branch
                const recorder = await db.user.findUnique({
                    where: { id: session.user.id },
                    include: { managedBranch: true }
                })
                if (recorder?.managedBranch) {
                    effectiveBranchId = recorder.managedBranch.id
                } else {
                    const firstBranch = await db.branch.findFirst({
                        select: { id: true }
                    })
                    effectiveBranchId = firstBranch?.id
                }
            }
        }

        if (!effectiveBranchId && groupId) {
            // Fallback: Try to get branch from first member if group doesn't have one
            const firstMember = await db.member.findFirst({
                where: { groupId },
                select: { branchId: true }
            })
            effectiveBranchId = firstMember?.branchId || undefined
        }

        // Final fallback: if we STILL don't have a branch, use the first available branch
        // This prevents hard crashes when legacy data is missing branch links.
        if (!effectiveBranchId) {
            const fallbackBranch = await db.branch.findFirst({
                select: { id: true },
            })

            if (!fallbackBranch) {
                throw new Error("No branches are configured in the system. Please create a branch first.")
            }

            effectiveBranchId = fallbackBranch.id
        }

        // 2. For Leadership Meeting, ensure we have Member records for leaders
        let processedRecords = records
        if (type === EventType.LEADERSHIP_MEETING) {
            // Get the first group (or create a default one) for leaders
            const defaultGroup = await db.ministryGroup.findFirst({
                where: { branchId: effectiveBranchId },
                select: { id: true }
            })

            if (!defaultGroup) {
                throw new Error("No group found in branch for leadership meeting")
            }

            // Process each record - create Member if it's a User ID, otherwise use as-is
            processedRecords = await Promise.all(records.map(async (record) => {
                // Check if this is a user ID (leader) or member ID
                const user = await db.user.findUnique({
                    where: { id: record.memberId },
                    select: { id: true, name: true }
                })

                if (user) {
                    // This is a leader (User), find or create Member record
                    let member = await db.member.findFirst({
                        where: {
                            name: user.name,
                            groupId: defaultGroup.id
                        },
                        select: { id: true }
                    })

                    if (!member) {
                        // Create member record for this leader
                        member = await db.member.create({
                            data: {
                                name: user.name,
                                groupId: defaultGroup.id,
                                branchId: effectiveBranchId,
                                status: "ESTABLISHED"
                            },
                            select: { id: true }
                        })
                    }

                    return {
                        memberId: member.id,
                        isPresent: record.isPresent
                    }
                }

                // Already a member ID, return as-is
                return record
            }))
        }

        // 3. Create session and records in a transaction
        const result = await db.$transaction(async (tx) => {
            const sessionData: any = {
                type,
                date,
                branchId: effectiveBranchId!,
                groupId: type === EventType.LEADERSHIP_MEETING ? undefined : groupId,
                cbsLocationId,
                recorderId: session.user.id,
                notes,
                records: {
                    create: processedRecords.map(r => ({
                        memberId: r.memberId,
                        isPresent: r.isPresent,
                        isLate: r.isLate || false
                    }))
                }
            }

            // Add cutoffTime if provided (will work after schema migration)
            if (cutoffTime) {
                sessionData.cutoffTime = cutoffTime
            }

            const attendanceSession = await tx.attendanceSession.create({
                data: sessionData
            })

            return attendanceSession
        })

        revalidatePath("/attendance")
        revalidatePath("/dashboard")
        return { success: true, sessionId: result.id }
    } catch (error: any) {
        console.error("Failed to save attendance:", error)
        throw new Error(error.message || "Failed to save attendance")
    }
}

export async function bulkSaveAttendanceAction(sessions: SaveAttendanceParams[]) {
    const session = await auth()
    if (!session) throw new Error("Unauthorized")

    try {
        const results = await db.$transaction(async (tx) => {
            const createdSessions = []
            for (const s of sessions) {
                // Determine branchId if not provided
                let effectiveBranchId = s.branchId
                if (!effectiveBranchId) {
                    const group = await tx.ministryGroup.findUnique({
                        where: { id: s.groupId },
                        select: { branchId: true }
                    })
                    effectiveBranchId = group?.branchId || undefined
                }

                if (!effectiveBranchId) {
                    const firstMember = await tx.member.findFirst({
                        where: { groupId: s.groupId },
                        select: { branchId: true }
                    })
                    effectiveBranchId = firstMember?.branchId || undefined
                }

                if (!effectiveBranchId) continue // Skip if branch cannot be determined

                const attendanceSession = await tx.attendanceSession.create({
                    data: {
                        type: s.type,
                        date: s.date,
                        branchId: effectiveBranchId,
                        groupId: s.groupId,
                        recorderId: session.user.id,
                        notes: s.notes,
                        records: {
                            create: s.records.map(r => ({
                                memberId: r.memberId,
                                isPresent: r.isPresent
                            }))
                        }
                    }
                })
                createdSessions.push(attendanceSession)
            }
            return createdSessions
        })

        revalidatePath("/attendance")
        revalidatePath("/dashboard")
        return { success: true, count: results.length }
    } catch (error: any) {
        console.error("Failed to bulk save attendance:", error)
        throw new Error("Failed to bulk save attendance")
    }
}
