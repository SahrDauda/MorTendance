import { NextRequest, NextResponse } from "next/server"
import { requireAuth, getUserId } from "@/lib/middleware"
import { db } from "@/lib/db"
import { z } from "zod"

export const runtime = "nodejs"

const deleteSchema = z.object({
    password: z.string().min(1),
    confirm: z.literal(true),
})

export async function DELETE(request: NextRequest) {
    try {
        const session = await requireAuth(request)
        const userId = getUserId(session)

        const body = await request.json()
        const { password, confirm } = deleteSchema.parse(body)

        if (!confirm) {
            return NextResponse.json(
                { error: "Please confirm account deletion" },
                { status: 400 }
            )
        }

        // Verify password
        const user = await db.user.findUnique({
            where: { id: userId },
        })

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        const bcrypt = await import("bcryptjs")
        const isPasswordValid = await bcrypt.default.compare(password, user.passwordHash)

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Invalid password" },
                { status: 401 }
            )
        }

        // Delete user (cascade will handle related records)
        await db.user.delete({
            where: { id: userId },
        })

        return NextResponse.json({ success: true, message: "Account deleted successfully" })
    } catch (error: any) {
        console.error("Delete account error:", error)
        if (error.status === 401) {
            return error
        }
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid request data", details: error.errors },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

