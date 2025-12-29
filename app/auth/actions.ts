"use server"

import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function registerAction(formData: z.infer<typeof registerSchema>) {
    try {
        const validatedData = registerSchema.parse(formData)
        const email = validatedData.email.toLowerCase()

        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return { error: "User with this email already exists" }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(validatedData.password, 10)

        // Check if this is the first user (make them ADMIN)
        const userCount = await db.user.count()
        const role = userCount === 0 ? "ADMIN" : "LEADER"

        // Create user
        const user = await db.user.create({
            data: {
                email,
                name: validatedData.name,
                passwordHash,
                role,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        })

        return { success: true, user }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { error: error.errors[0].message }
        }
        console.error("Registration error:", error)
        return { error: "Internal server error during registration" }
    }
}
