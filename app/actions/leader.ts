"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"

interface CreateLeaderData {
    name: string
    email: string
    role: "PROBATION_LEADER" | "JUNIOR_LEADER" | "SENIOR_LEADER" | "ADMIN"
    branchId?: string
    groupId?: string
}

export async function createLeaderAction(data: CreateLeaderData) {
    const session = await auth()

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
        throw new Error("Unauthorized")
    }

    if (!data.name || !data.email || !data.role) {
        throw new Error("Name, Email, and Role are required")
    }

    // Validation: Only SUPER_ADMIN can create ADMINs
    if (data.role === "ADMIN" && session.user.role !== "SUPER_ADMIN") {
        throw new Error("Only Super Admins can create Admins")
    }

    // Validation: Only Senior Leaders can be assigned to a branch
    if (data.branchId && data.role !== "SENIOR_LEADER") {
        throw new Error("Only Senior Leaders can be assigned to a branch")
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
                role: data.role as UserRole,
                // Assign to Branch if provided (and valid)
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
