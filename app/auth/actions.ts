"use server"

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

        console.log("[Auth Action] Mock registration for:", email)

        // Mock success
        return {
            success: true,
            user: {
                id: "mock-id-" + Date.now(),
                email,
                name: validatedData.name,
                role: "LEADER",
            }
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { error: error.errors[0].message }
        }
        console.error("Registration error:", error)
        return { error: "Internal server error during registration" }
    }
}
