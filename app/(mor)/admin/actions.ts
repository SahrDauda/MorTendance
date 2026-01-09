"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"

const addLeaderSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    groupId: z.string().optional(),
    role: z.enum(["PROBATION_LEADER", "JUNIOR_LEADER", "SENIOR_LEADER"]).default("PROBATION_LEADER"),
})

export async function addLeaderAction(formData: any) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized: Admin access required")
    }

    try {
        const validatedData = addLeaderSchema.parse(formData)
        const email = validatedData.email.toLowerCase().trim()

        const existingUser = await db.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return { error: "A user with this email already exists" }
        }

        const hashedPassword = await bcrypt.hash(validatedData.password, 10)

        const leader = await db.user.create({
            data: {
                name: validatedData.name,
                email,
                passwordHash: hashedPassword,
                role: validatedData.role as UserRole,
                managedGroups: validatedData.groupId ? {
                    connect: { id: validatedData.groupId }
                } : undefined
            }
        })

        revalidatePath("/admin/leaders")
        revalidatePath("/dashboard")

        return {
            success: true,
            leader
        }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { error: error.errors[0].message }
        }
        console.error("Add leader error:", error)
        return { error: error.message || "Failed to create leader" }
    }
}

export async function getLeadersAction() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized: Admin access required")
    }

    return await db.user.findMany({
        where: {
            role: {
                in: [UserRole.SENIOR_LEADER, UserRole.JUNIOR_LEADER, UserRole.PROBATION_LEADER]
            }
        },
        include: {
            managedGroups: {
                include: {
                    _count: {
                        select: { members: true }
                    }
                }
            }
        },
        orderBy: {
            name: 'asc'
        }
    })
}

export async function getLeaderDetailsAction(leaderId: string) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized: Admin access required")
    }

    return await db.user.findUnique({
        where: { id: leaderId },
        include: {
            managedGroups: {
                include: {
                    members: {
                        include: {
                            _count: {
                                select: { attendanceRecords: true }
                            }
                        }
                    }
                }
            }
        }
    })
}
