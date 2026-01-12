"use server"

import { db } from "@/lib/db"
import { EventType } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function checkInAction(data: {
    identifier: string // phone or email
    branchId: string
    type: string
}) {
    if (!data.identifier || !data.branchId || !data.type) {
        return { error: "Missing required information" }
    }

    try {
        // 1. Find the member
        const member = await db.member.findFirst({
            where: {
                OR: [
                    { phoneNumber: data.identifier },
                    { name: { equals: data.identifier, mode: 'insensitive' } } // Fallback to name if phone not provided? Maybe better to stick to phone/email
                ]
            },
            include: {
                group: true
            }
        })

        if (!member) {
            return { error: "MEMBER_NOT_FOUND" }
        }

        // 2. Find or create an AttendanceSession for today
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        let session = await db.attendanceSession.findFirst({
            where: {
                branchId: data.branchId,
                type: data.type as EventType,
                date: today,
                groupId: member.groupId // Scoped to their group
            }
        })

        if (!session) {
            // We need a recorderId. For self-check-in, we can use a system user or the branch head.
            // For now, let's find the branch head or any admin.
            const branch = await db.branch.findUnique({
                where: { id: data.branchId },
                select: { headId: true }
            })

            const recorderId = branch?.headId || (await db.user.findFirst({ where: { role: "ADMIN" } }))?.id

            if (!recorderId) {
                return { error: "System configuration error: No recorder found for this branch" }
            }

            session = await db.attendanceSession.create({
                data: {
                    branchId: data.branchId,
                    type: data.type as EventType,
                    date: today,
                    groupId: member.groupId,
                    recorderId: recorderId
                }
            })
        }

        // 3. Create or update the AttendanceRecord
        await db.attendanceRecord.upsert({
            where: {
                sessionId_memberId: {
                    sessionId: session.id,
                    memberId: member.id
                }
            },
            update: {
                isPresent: true
            },
            create: {
                sessionId: session.id,
                memberId: member.id,
                isPresent: true
            }
        })

        revalidatePath("/attendance")
        revalidatePath("/dashboard")

        return {
            success: true,
            memberName: member.name,
            groupName: member.group.name
        }
    } catch (error: any) {
        console.error("Check-in error:", error)
        return { error: "An unexpected error occurred during check-in" }
    }
}
