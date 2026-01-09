"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

interface CreateGroupData {
    name: string
    leaderId?: string
    branchId?: string
}

export async function createGroupAction(data: CreateGroupData) {
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    if (!data.name) {
        throw new Error("Group name is required")
    }

    try {
        const group = await db.ministryGroup.create({
            data: {
                name: data.name,
                leaderId: data.leaderId || undefined,
                branchId: data.branchId || undefined
            }
        })

        revalidatePath("/dashboard")
        return { success: true, group }
    } catch (error: any) {
        console.error("Failed to create group:", error)
        if (error.code === 'P2002') {
            throw new Error("A group with this name already exists")
        }
        throw new Error("Failed to create group")
    }
}
