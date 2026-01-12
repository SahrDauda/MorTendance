"use server"

import { db } from "@/lib/db"
import { EventType, Gender, MemberStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function registerNewcomerAction(data: {
    name: string
    phoneNumber: string
    address: string
    gender: Gender
    groupId: string
    branchId: string
    eventType: EventType
}) {
    try {
        // 1. Create the member
        const member = await db.member.create({
            data: {
                name: data.name,
                phoneNumber: data.phoneNumber,
                address: data.address,
                gender: data.gender,
                groupId: data.groupId,
                branchId: data.branchId,
                status: MemberStatus.PRELIMINARY
            }
        })

        // 2. Find or create an AttendanceSession for today
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        let session = await db.attendanceSession.findFirst({
            where: {
                branchId: data.branchId,
                type: data.eventType,
                date: today,
                groupId: data.groupId
            }
        })

        if (!session) {
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
                    type: data.eventType,
                    date: today,
                    groupId: data.groupId,
                    recorderId: recorderId
                }
            })
        }

        // 3. Create the AttendanceRecord
        await db.attendanceRecord.create({
            data: {
                sessionId: session.id,
                memberId: member.id,
                isPresent: true
            }
        })

        revalidatePath("/attendance")
        revalidatePath("/dashboard")
        revalidatePath("/members")

        return { success: true }
    } catch (error: any) {
        console.error("Newcomer registration error:", error)
        if (error.code === 'P2002') {
            return { error: "A member with this phone number already exists" }
        }
        return { error: "Failed to register newcomer" }
    }
}
