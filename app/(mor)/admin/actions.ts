"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
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

        console.log("[Admin Action] Mock add leader:", email)

        // Mock success
        revalidatePath("/admin/leaders")
        revalidatePath("/dashboard")

        return {
            success: true,
            leader: {
                id: "mock-leader-" + Date.now(),
                email,
                name: validatedData.name,
                role: "LEADER",
                createdAt: new Date(),
            }
        }
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

    console.log("[Admin Action] Mock get leaders")

    return [
        {
            id: "leader-1",
            name: "John Leader",
            email: "leader@mor.org",
            role: "LEADER",
            managedGroups: [
                { id: "g1", name: "Huiothesia", _count: { members: 12 } }
            ],
            createdAt: new Date()
        }
    ]
}

export async function getLeaderDetailsAction(leaderId: string) {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized: Admin access required")
    }

    console.log("[Admin Action] Mock get leader details for:", leaderId)

    return {
        id: leaderId,
        name: "John Leader",
        email: "leader@mor.org",
        role: "LEADER",
        createdAt: new Date(),
        managedGroups: [
            {
                id: "g1",
                name: "Huiothesia",
                members: [
                    {
                        id: "m1",
                        name: "Mock Member 1",
                        phoneNumber: "123-456-7890",
                        status: "ESTABLISHED",
                        joinedAt: new Date(),
                        _count: { attendance: 15 }
                    }
                ]
            }
        ]
    }
}
