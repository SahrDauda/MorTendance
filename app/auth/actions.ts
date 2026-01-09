"use server"

import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function registerAction(formData: z.infer<typeof registerSchema>) {
    try {
        const validatedData = registerSchema.parse(formData)
        const email = validatedData.email.toLowerCase().trim()

        // 1. Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return { error: "A user with this email already exists" }
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(validatedData.password, 10)

        // 3. Create user
        const user = await db.user.create({
            data: {
                name: validatedData.name,
                email,
                passwordHash: hashedPassword,
                role: UserRole.PROBATION_LEADER, // Default role for self-registration
            }
        })

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            }
        }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { error: error.errors[0].message }
        }
        console.error("Registration error:", error)
        return { error: error.message || "Failed to register account" }
    }
}
