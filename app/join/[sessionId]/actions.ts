"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Mark an existing member as present in a session
export async function memberCheckInAction(sessionId: string, memberId: string) {
    if (!sessionId || !memberId) {
        return { error: "Missing session or member ID" }
    }

    try {
        // Verify session exists and is active
        const session = await db.attendanceSession.findUnique({
            where: { id: sessionId },
            select: { id: true, isActive: true, branchId: true }
        })

        if (!session) return { error: "Session not found" }
        if (!session.isActive) return { error: "This session is no longer active" }

        // Upsert the attendance record
        await db.attendanceRecord.upsert({
            where: {
                sessionId_memberId: { sessionId, memberId }
            },
            update: { isPresent: true },
            create: { sessionId, memberId, isPresent: true }
        })

        const member = await db.member.findUnique({
            where: { id: memberId },
            select: { name: true }
        })

        revalidatePath("/attendance")
        revalidatePath("/dashboard")

        return { success: true, memberName: member?.name || "Member" }
    } catch (error: any) {
        console.error("Member check-in error:", error)
        return { error: "An unexpected error occurred" }
    }
}

// Register a first-timer and mark them present in the session
export async function firstTimerCheckInAction(data: {
    sessionId: string
    name: string
    invitedBy?: string
}) {
    const { sessionId, name, invitedBy } = data

    if (!sessionId || !name?.trim()) {
        return { error: "Session ID and name are required" }
    }

    try {
        // Fetch session details to get branchId and groupId
        const session = await db.attendanceSession.findUnique({
            where: { id: sessionId },
            select: { id: true, isActive: true, branchId: true, groupId: true }
        })

        if (!session) return { error: "Session not found" }
        if (!session.isActive) return { error: "This session is no longer active" }

        // Resolve the group: use session's groupId or fall back to first group in branch
        let groupId = session.groupId
        if (!groupId) {
            const fallbackGroup = await db.ministryGroup.findFirst({
                where: { branchId: session.branchId },
                select: { id: true }
            })
            groupId = fallbackGroup?.id ?? null
        }

        if (!groupId) {
            return { error: "No group configured for this session. Please contact a leader." }
        }

        // Create the member + attendance record in a transaction
        const result = await db.$transaction(async (tx) => {
            const newMember = await tx.member.create({
                data: {
                    name: name.trim(),
                    groupId,
                    branchId: session.branchId,
                    status: "PRELIMINARY"
                }
            })

            await tx.attendanceRecord.create({
                data: {
                    sessionId,
                    memberId: newMember.id,
                    isPresent: true,
                    notes: invitedBy ? `Invited by: ${invitedBy.trim()}` : undefined
                }
            })

            return newMember
        })

        revalidatePath("/attendance")
        revalidatePath("/dashboard")
        revalidatePath("/members")

        return { success: true, memberName: result.name }
    } catch (error: any) {
        console.error("First-timer check-in error:", error)
        return { error: "Failed to register. Please try again." }
    }
}
