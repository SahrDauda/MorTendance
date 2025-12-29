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
