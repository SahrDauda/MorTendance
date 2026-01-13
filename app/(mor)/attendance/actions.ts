"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { EventType } from "@prisma/client"

interface AttendanceRecord {
    memberId: string
    isPresent: boolean
}

interface SaveAttendanceParams {
    groupId?: string
    cbsLocationId?: string
    branchId?: string
    type: EventType
    date: Date
    records: AttendanceRecord[]
    notes?: string
}

export async function saveAttendanceAction({ groupId, cbsLocationId, branchId, type, date, records, notes }: SaveAttendanceParams) {
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

        if (!effectiveBranchId) {
            throw new Error("Could not determine branch for this attendance session")
        }

        // 2. Create session and records in a transaction
        const result = await db.$transaction(async (tx) => {
            const attendanceSession = await tx.attendanceSession.create({
                data: {
                    type,
                    date,
                    branchId: effectiveBranchId!,
                    groupId,
                    cbsLocationId,
                    recorderId: session.user.id,
                    notes,
                    records: {
                        create: records.map(r => ({
                            memberId: r.memberId,
                            isPresent: r.isPresent
                        }))
                    }
                }
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
