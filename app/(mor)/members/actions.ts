"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

interface AddMemberParams {
    name: string
    phoneNumber?: string
    groupId: string
    branchId?: string
}

export async function addMemberAction({ name, phoneNumber, groupId, branchId }: AddMemberParams) {
    const session = await auth()
    if (!session) throw new Error("Unauthorized")

    try {
        const member = await db.member.create({
            data: {
                name,
                phoneNumber,
                groupId,
                branchId: branchId || undefined,
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

export async function bulkAddMembersAction(members: AddMemberParams[]) {
    const session = await auth()
    if (!session) throw new Error("Unauthorized")

    try {
        const createdMembers = await db.$transaction(
            members.map(member => db.member.create({
                data: {
                    name: member.name,
                    phoneNumber: member.phoneNumber,
                    groupId: member.groupId,
                    branchId: member.branchId || undefined,
                    status: "PRELIMINARY",
                }
            }))
        )

        revalidatePath("/members")
        revalidatePath("/dashboard")
        revalidatePath("/attendance")

        return { success: true, count: createdMembers.length }
    } catch (error: any) {
        console.error("Failed to bulk add members:", error)
        throw new Error("Failed to bulk add members")
    }
}
