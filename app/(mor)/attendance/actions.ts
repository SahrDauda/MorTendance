"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { MemberStatus } from "@prisma/client"

interface AttendanceRecord {
    memberId: string
    isPresent: boolean
}

interface SaveAttendanceParams {
    groupId: string
    date: Date
    records: AttendanceRecord[]
}

export async function saveAttendanceAction({ groupId, date, records }: SaveAttendanceParams) {
    const session = await auth()
    if (!session) throw new Error("Unauthorized")

    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const quarter = Math.ceil(month / 3)

    // Use a transaction to ensure data integrity
    return await db.$transaction(async (tx) => {
        for (const record of records) {
            // 1. Upsert attendance record
            await tx.attendance.upsert({
                where: {
                    memberId_date: {
                        memberId: record.memberId,
                        date: date,
                    }
                },
                update: {
                    isPresent: record.isPresent,
                    quarter,
                    year,
                },
                create: {
                    memberId: record.memberId,
                    date: date,
                    isPresent: record.isPresent,
                    quarter,
                    year,
                }
            })

            // 2. Progression Logic: Preliminary -> Semi-consistent after 3 fellowships
            if (record.isPresent) {
                const member = await tx.member.findUnique({
                    where: { id: record.memberId },
                    select: { status: true }
                })

                if (member?.status === MemberStatus.PRELIMINARY) {
                    const attendanceCount = await tx.attendance.count({
                        where: {
                            memberId: record.memberId,
                            isPresent: true
                        }
                    })

                    if (attendanceCount >= 3) {
                        await tx.member.update({
                            where: { id: record.memberId },
                            data: { status: MemberStatus.SEMI_CONSISTENT }
                        })
                    }
                }
            }
        }

        revalidatePath("/attendance")
        revalidatePath("/dashboard")
        return { success: true }
    })
}
