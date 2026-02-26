"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

interface AddMemberParams {
    name: string
    phoneNumber?: string
    groupId: string
    branchId: string
}

export async function addMemberAction({ name, phoneNumber, groupId, branchId }: AddMemberParams) {
    const session = await auth()
    if (!session) throw new Error("Unauthorized")

    try {
        // Validate that the group belongs to the selected branch
        const group = await db.ministryGroup.findUnique({
            where: { id: groupId },
            select: { branchId: true }
        })

        if (!group) {
            throw new Error("Group not found")
        }

        if (group.branchId !== branchId) {
            throw new Error("Selected group does not belong to the selected branch")
        }

        const member = await db.member.create({
            data: {
                name,
                phoneNumber,
                groupId,
                branchId,
                status: "PRELIMINARY",
            }
        })

        revalidatePath("/members")
        revalidatePath("/dashboard")
        revalidatePath("/attendance")

        return { success: true, member }
    } catch (error: any) {
        console.error("Failed to add member:", error)
        throw new Error("Failed to add member")
    }
}


