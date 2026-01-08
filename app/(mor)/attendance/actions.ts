"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

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

    console.log("[Attendance Action] Mock save attendance for group:", groupId)

    // Mock success
    revalidatePath("/attendance")
    revalidatePath("/dashboard")
    return { success: true }
}
