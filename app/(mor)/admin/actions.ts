"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"
import { logAction } from "@/lib/audit"

const addLeaderSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    groupId: z.string().optional(),
    role: z.enum(["PROBATION_LEADER", "JUNIOR_LEADER", "SENIOR_LEADER"]).default("PROBATION_LEADER"),
})

const addCBSSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    address: z.string().optional(),
    district: z.string().optional(),
    branchId: z.string().min(1, "Branch is required"),
    leaderId: z.string().optional(),
})

const addBranchSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    headId: z.string().optional(),
})

const addGroupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    branchId: z.string().min(1, "Branch is required"),
    leaderId: z.string().optional(),
})

const updateUserSchema = z.object({
    userId: z.string().min(1),
    role: z.nativeEnum(UserRole),
    branchId: z.string().optional(),
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

        await logAction("CREATE", "USER", leader.id, `Created leader: ${leader.name} (${leader.role})`)

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

export async function addCBSAction(formData: any) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    try {
        const validatedData = addCBSSchema.parse(formData)
        const cbs = await db.cBSLocation.create({
            data: {
                name: validatedData.name,
                address: validatedData.address,
                district: validatedData.district,
                branchId: validatedData.branchId,
                leaderId: validatedData.leaderId || undefined
            }
        })

        await logAction("CREATE", "CBS_LOCATION", cbs.id, `Created CBS location: ${cbs.name}`)

        revalidatePath("/admin/cbs")
        return { success: true, cbs }
    } catch (error: any) {
        return { error: error.message || "Failed to create CBS location" }
    }
}

export async function addBranchAction(formData: any) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    try {
        const validatedData = addBranchSchema.parse(formData)
        const branch = await db.branch.create({
            data: {
                name: validatedData.name,
                headId: validatedData.headId || undefined
            }
        })

        await logAction("CREATE", "BRANCH", branch.id, `Created branch: ${branch.name}`)

        revalidatePath("/admin/branches")
        return { success: true, branch }
    } catch (error: any) {
        return { error: error.message || "Failed to create branch" }
    }
}

export async function addGroupAction(formData: any) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    try {
        const validatedData = addGroupSchema.parse(formData)
        const group = await db.ministryGroup.create({
            data: {
                name: validatedData.name,
                branchId: validatedData.branchId,
                leaderId: validatedData.leaderId || undefined
            }
        })

        await logAction("CREATE", "MINISTRY_GROUP", group.id, `Created group: ${group.name}`)

        revalidatePath("/admin/groups")
        return { success: true, group }
    } catch (error: any) {
        return { error: error.message || "Failed to create group" }
    }
}

export async function getUsersAction() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    return await db.user.findMany({
        include: {
            managedBranch: true,
            managedGroups: true,
            managedCBS: true
        },
        orderBy: { name: 'asc' }
    })
}

export async function updateUserAction(formData: any) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    try {
        const validatedData = updateUserSchema.parse(formData)

        await db.user.update({
            where: { id: validatedData.userId },
            data: {
                role: validatedData.role,
            }
        })

        await logAction("UPDATE", "USER", validatedData.userId, `Updated user role to: ${validatedData.role}`)

        revalidatePath("/admin/users")
        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Failed to update user" }
    }
}


export async function getAuditLogsAction() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    try {
        return await db.auditLog.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        })
    } catch (error) {
        console.error("Failed to fetch audit logs:", error)
        return []
    }
}

export async function getSettingsAction() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    return await db.systemSetting.findMany()
}

export async function updateSettingAction(key: string, value: string) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    try {
        const setting = await db.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        })

        await logAction("UPDATE", "SYSTEM_SETTING", setting.id, `Updated setting ${key} to ${value}`)

        revalidatePath("/admin/settings")
        return { success: true }
    } catch (error: any) {
        console.error("Failed to update setting:", error)
        return { error: error.message || "Failed to update setting" }
    }
}
