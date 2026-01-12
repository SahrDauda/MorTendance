"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createBranchAction(data: { name: string, headId?: string }) {
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    if (!data.name) {
        throw new Error("Branch name is required")
    }

    try {
        const branch = await db.branch.create({
            data: {
                name: data.name,
                headId: data.headId === "none" ? undefined : data.headId
            }
        })

        revalidatePath("/dashboard")
        return { success: true, branch }
    } catch (error: any) {
        console.error("Failed to create branch:", error)
        if (error.code === 'P2002') {
            throw new Error("A branch with this name already exists")
        }
        throw new Error("Failed to create branch")
    }
}
