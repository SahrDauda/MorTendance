"use server"

import { db } from "@/lib/db"
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

    // Check permissions: Leaders can only add members to their own groups
    if (session.user.role === "LEADER") {
        const group = await db.ministryGroup.findUnique({
            where: { id: groupId },
            select: { leaderId: true },
        })

        if (!group || group.leaderId !== session.user.id) {
            throw new Error("Unauthorized: You can only add members to your own groups")
        }
    }
    // Admin can add to any group - no additional check needed

    const member = await db.member.create({
        data: {
            name,
            phoneNumber,
            groupId,
        }
    })

    revalidatePath("/members")
    revalidatePath("/dashboard")
    revalidatePath("/attendance")

    return member
}
