"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

interface AddMemberParams {
    name: string
    phoneNumber?: string
    groupId: string
}

export async function addMemberAction({ name, phoneNumber, groupId }: AddMemberParams) {
    const session = await auth()
    if (!session) throw new Error("Unauthorized")

    console.log("[Members Action] Mock add member:", name)

    // Mock success
    revalidatePath("/members")
    revalidatePath("/dashboard")
    revalidatePath("/attendance")

    return {
        id: "mock-member-" + Date.now(),
        name,
        phoneNumber,
        groupId,
        status: "PRELIMINARY",
        joinedAt: new Date(),
    }
}
