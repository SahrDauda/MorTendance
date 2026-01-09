"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"

interface CreateLeaderData {
    name: string
    email: string
    branchId?: string
    groupId?: string
}

export async function createLeaderAction(data: CreateLeaderData) {
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    if (!data.name || !data.email) {
        throw new Error("Name and Email are required")
    }

    try {
        // 1. Check if email exists
        const existingUser = await db.user.findUnique({
            where: { email: data.email }
        })

        if (existingUser) {
            throw new Error("A user with this email already exists")
        }

        // 2. Hash default password
        const hashedPassword = await bcrypt.hash("leader123", 10)

        // 3. Create the User
        const user = await db.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash: hashedPassword,
                role: UserRole.LEADER,
                // Assign to Branch if provided
                managedBranch: data.branchId ? {
                    connect: { id: data.branchId }
                } : undefined,
                // Assign to Group if provided
                managedGroups: data.groupId ? {
                    connect: { id: data.groupId }
                } : undefined
            }
        })

        revalidatePath("/dashboard")
        revalidatePath("/admin/leaders")
        return { success: true, user }
    } catch (error: any) {
        console.error("Failed to create leader:", error)
        throw new Error(error.message || "Failed to create leader")
    }
}
