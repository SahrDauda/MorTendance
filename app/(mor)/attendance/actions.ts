"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { EventType, MemberStatus } from "@prisma/client"

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

        // 3. Find or create session and upsert records in a transaction
        const result = await db.$transaction(async (tx) => {
            // Normalize date to start of day for comparison (Prisma Date type stores only date, no time)
            const sessionDate = new Date(date)
            sessionDate.setHours(0, 0, 0, 0)

            // Build where clause for finding existing session
            const whereClause: any = {
                type,
                date: sessionDate,
                branchId: effectiveBranchId!,
            }

            // Add group/location filters based on event type
            if (type === EventType.LEADERSHIP_MEETING) {
                // Leadership meetings don't have groups
                whereClause.groupId = null
            } else if (type === EventType.CBS) {
                whereClause.cbsLocationId = cbsLocationId || null
            } else {
                whereClause.groupId = groupId || null
            }

            // Check if a session already exists for this group/date/type combination
            const existingSession = await tx.attendanceSession.findFirst({
                where: whereClause,
                include: {
                    records: true
                }
            })

            let attendanceSession

            if (existingSession) {
                // Update existing session
                attendanceSession = await tx.attendanceSession.update({
                    where: { id: existingSession.id },
                    data: {
                        notes: notes || existingSession.notes,
                        cutoffTime: cutoffTime || existingSession.cutoffTime,
                        recorderId: session.user.id, // Update recorder to current user
                    }
                })

                // Upsert records: update existing or create new
                for (const record of processedRecords) {
                    await tx.attendanceRecord.upsert({
                        where: {
                            sessionId_memberId: {
                                sessionId: existingSession.id,
                                memberId: record.memberId
                            }
                        },
                        update: {
                            isPresent: record.isPresent,
                            isLate: record.isLate || false
                        },
                        create: {
                            sessionId: existingSession.id,
                            memberId: record.memberId,
                            isPresent: record.isPresent,
                            isLate: record.isLate || false
                        }
                    })
                }
            } else {
                // Create new session
                const sessionData: any = {
                    type,
                    date: sessionDate,
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

                // Add cutoffTime if provided
                if (cutoffTime) {
                    sessionData.cutoffTime = cutoffTime
                }

                attendanceSession = await tx.attendanceSession.create({
                    data: sessionData
                })
            }

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

// Action to clean up duplicate attendance records
export async function cleanupDuplicateAttendanceAction() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized: Admin access required")
    }

    try {
        let deletedRecords = 0
        let mergedSessions = 0

        // Find all sessions grouped by group/date/type
        const allSessions = await db.attendanceSession.findMany({
            include: {
                records: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        // Group sessions by unique key (group/date/type)
        const sessionGroups = new Map<string, typeof allSessions>()

        for (const sess of allSessions) {
            const key = `${sess.groupId || 'null'}_${sess.cbsLocationId || 'null'}_${sess.date.toISOString().split('T')[0]}_${sess.type}`
            if (!sessionGroups.has(key)) {
                sessionGroups.set(key, [])
            }
            sessionGroups.get(key)!.push(sess)
        }

        // Process each group
        for (const [key, sessions] of sessionGroups) {
            if (sessions.length > 1) {
                // Keep the first session, merge others into it
                const keepSession = sessions[0]
                const deleteSessions = sessions.slice(1)

                for (const deleteSession of deleteSessions) {
                    // Move records from duplicate session to the kept session
                    for (const record of deleteSession.records) {
                        // Check if record already exists in kept session
                        const existingRecord = keepSession.records.find(
                            r => r.memberId === record.memberId
                        )

                        if (existingRecord) {
                            // Update existing record, then delete duplicate
                            await db.attendanceRecord.delete({
                                where: { id: record.id }
                            })
                            deletedRecords++
                        } else {
                            // Move record to kept session
                            await db.attendanceRecord.update({
                                where: { id: record.id },
                                data: { sessionId: keepSession.id }
                            })
                        }
                    }

                    // Delete the duplicate session
                    await db.attendanceSession.delete({
                        where: { id: deleteSession.id }
                    })
                    mergedSessions++
                }
            }
        }

        // Also check for duplicate records within the same session (shouldn't happen due to unique constraint, but just in case)
        const allRecords = await db.attendanceRecord.findMany({
            orderBy: {
                createdAt: 'asc'
            }
        })

        const recordMap = new Map<string, typeof allRecords>()
        for (const record of allRecords) {
            const key = `${record.sessionId}_${record.memberId}`
            if (!recordMap.has(key)) {
                recordMap.set(key, [])
            }
            recordMap.get(key)!.push(record)
        }

        for (const [key, records] of recordMap) {
            if (records.length > 1) {
                // Keep first, delete rest
                const toDelete = records.slice(1)
                await db.attendanceRecord.deleteMany({
                    where: {
                        id: { in: toDelete.map(r => r.id) }
                    }
                })
                deletedRecords += toDelete.length
            }
        }

        revalidatePath("/attendance")
        return {
            success: true,
            deletedRecords,
            mergedSessions
        }
    } catch (error: any) {
        console.error("Failed to cleanup duplicates:", error)
        throw new Error(error.message || "Failed to cleanup duplicates")
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

// Delete a single attendance record (admin only)
export async function deleteAttendanceRecordAction(recordId: string) {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
        throw new Error("Unauthorized: Admin access required")
    }

    try {
        const record = await db.attendanceRecord.findUnique({
            where: { id: recordId },
            include: {
                member: {
                    select: { name: true }
                },
                session: {
                    select: {
                        id: true,
                        date: true,
                        type: true,
                        group: {
                            select: { name: true }
                        }
                    }
                }
            }
        })

        if (!record) {
            throw new Error("Attendance record not found")
        }

        await db.attendanceRecord.delete({
            where: { id: recordId }
        })

        // Log the deletion
        await db.auditLog.create({
            data: {
                userId: session.user.id,
                action: "DELETE",
                entity: "ATTENDANCE_RECORD",
                entityId: recordId,
                details: `Deleted attendance for ${record.member.name} from ${record.session.group?.name || 'session'} on ${record.session.date.toISOString().split('T')[0]}`
            }
        })

        revalidatePath("/attendance")
        revalidatePath("/dashboard")
        return {
            success: true,
            message: `Attendance for ${record.member.name} has been deleted`
        }
    } catch (error: any) {
        console.error("Failed to delete attendance record:", error)
        throw new Error(error.message || "Failed to delete attendance record")
    }
}

// Delete an entire attendance session (admin only)
export async function deleteAttendanceSessionAction(sessionId: string) {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
        throw new Error("Unauthorized: Admin access required")
    }

    try {
        const attendanceSession = await db.attendanceSession.findUnique({
            where: { id: sessionId },
            include: {
                group: {
                    select: { name: true }
                },
                records: {
                    include: {
                        member: {
                            select: { name: true }
                        }
                    }
                },
                _count: {
                    select: { records: true }
                }
            }
        })

        if (!attendanceSession) {
            throw new Error("Attendance session not found")
        }

        // Delete the session (cascade will delete all records)
        await db.attendanceSession.delete({
            where: { id: sessionId }
        })

        // Log the deletion
        await db.auditLog.create({
            data: {
                userId: session.user.id,
                action: "DELETE",
                entity: "ATTENDANCE_SESSION",
                entityId: sessionId,
                details: `Deleted attendance session for ${attendanceSession.group?.name || 'session'} on ${attendanceSession.date.toISOString().split('T')[0]} (${attendanceSession._count.records} records)`
            }
        })

        revalidatePath("/attendance")
        revalidatePath("/dashboard")
        return {
            success: true,
            message: `Attendance session with ${attendanceSession._count.records} records has been deleted`
        }
    } catch (error: any) {
        console.error("Failed to delete attendance session:", error)
        throw new Error(error.message || "Failed to delete attendance session")
    }
}

export async function getOrCreateSessionForQRAction(data: {
    branchId: string
    groupId?: string
    type: EventType
}) {
    const session = await auth()
    if (!session) throw new Error("Unauthorized")

    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Find existing session for today
        let attendanceSession = await db.attendanceSession.findFirst({
            where: {
                branchId: data.branchId,
                groupId: data.groupId || null,
                type: data.type,
                date: today,
            }
        })

        if (!attendanceSession) {
            // Create new session if it doesn't exist
            // We use the current user as the recorder
            attendanceSession = await db.attendanceSession.create({
                data: {
                    branchId: data.branchId,
                    groupId: data.groupId || undefined,
                    type: data.type,
                    date: today,
                    recorderId: session.user.id,
                }
            })
        }

        return { success: true, sessionId: attendanceSession.id }
    } catch (error: any) {
        console.error("Failed to get/create session for QR:", error)
        return { error: error.message || "Failed to prepare attendance session" }
    }
}

export async function bulkCreatePreliminaryMembersAction(data: {
    branchId: string;
    groupId: string;
    members: { name: string; status?: MemberStatus }[];
}) {
    try {
        const session = await auth()
        if (!session?.user) {
            return { error: "Unauthorized" }
        }

        if (!data.members || data.members.length === 0) {
            return { error: "No valid members provided" }
        }

        const createdMembers = []

        for (const member of data.members) {
            const { name, status } = member
            if (!name || name.trim().length === 0) {
                continue // Skip empty names
            }

            const memberStatus = status || "PRELIMINARY"

            const existing = await db.member.findFirst({
                where: {
                    name: { equals: name.trim(), mode: 'insensitive' },
                    groupId: data.groupId,
                    branchId: data.branchId
                }
            })

            if (!existing) {
                const newMember = await db.member.create({
                    data: {
                        name: name.trim(),
                        status: memberStatus,
                        branchId: data.branchId,
                        groupId: data.groupId
                    }
                })
                createdMembers.push(newMember)
            } else {
                // Update status if provided or if existing status is PRELIMINARY and new status is different
                if (status && existing.status !== memberStatus) {
                    const updatedMember = await db.member.update({
                        where: { id: existing.id },
                        data: { status: memberStatus }
                    })
                    createdMembers.push(updatedMember)
                } else {
                    createdMembers.push(existing)
                }
            }
        }

        revalidatePath("/members")
        revalidatePath("/attendance")
        return {
            success: true,
            count: createdMembers.length,
            createdMembers: createdMembers.map(m => ({ id: m.id, name: m.name }))
        }
    } catch (error: any) {
        console.error("Failed to bulk create preliminary members:", error)
        return { error: error.message || "Failed to create missing members" }
    }
}

