"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { z } from "zod"

const addLeaderSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    groupId: z.string().optional(),
})

export async function addLeaderAction(formData: z.infer<typeof addLeaderSchema>) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized: Admin access required")
    }

    try {
        const validatedData = addLeaderSchema.parse(formData)
        const email = validatedData.email.toLowerCase().trim()

        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return { error: "User with this email already exists" }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(validatedData.password, 10)

        // Create leader user
        const leader = await db.user.create({
            data: {
                email,
                name: validatedData.name,
                passwordHash,
                role: "LEADER",
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        })

        // Assign group if provided
        if (validatedData.groupId) {
            await db.ministryGroup.update({
                where: { id: validatedData.groupId },
                data: { leaderId: leader.id },
            })
        }

        revalidatePath("/admin/leaders")
        revalidatePath("/dashboard")

        return { success: true, leader }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { error: error.errors[0].message }
        }
        console.error("Add leader error:", error)
        return { error: "Failed to create leader" }
    }
}

export async function getLeadersAction() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized: Admin access required")
    }

    const leaders = await db.user.findMany({
        where: { role: "LEADER" },
        include: {
            managedGroups: {
                include: {
                    members: {
                        select: {
                            id: true,
                            name: true,
                            status: true,
                            phoneNumber: true,
                            joinedAt: true,
                        },
                    },
                    _count: {
                        select: { members: true },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    })

    return leaders
}

export async function getLeaderDetailsAction(leaderId: string) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized: Admin access required")
    }

    const leader = await db.user.findUnique({
        where: { id: leaderId, role: "LEADER" },
        include: {
            managedGroups: {
                include: {
                    members: {
                        include: {
                            attendance: {
                                orderBy: { date: "desc" },
                                take: 10,
                            },
                            _count: {
                                select: {
                                    attendance: {
                                        where: { isPresent: true },
                                    },
                                },
                            },
                        },
                        orderBy: { name: "asc" },
                    },
                },
            },
        },
    })

    if (!leader) {
        throw new Error("Leader not found")
    }

    return leader
}

