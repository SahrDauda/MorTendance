import { NextRequest, NextResponse } from "next/server"
import { requireAuth, getUserId } from "@/lib/middleware"
import { db } from "@/lib/db"
import { z } from "zod"

export const runtime = "nodejs"

const settingsSchema = z.object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    profileVisibility: z.enum(["public", "connections", "private"]).optional(),
    showEmail: z.boolean().optional(),
    showPhone: z.boolean().optional(),
    language: z.string().optional(),
    theme: z.enum(["light", "dark", "system"]).optional(),
})

export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth(request)
        const userId = getUserId(session)

        // For now, return default settings
        // In the future, you can add a user_settings table
        return NextResponse.json({
            settings: {
                emailNotifications: true,
                pushNotifications: true,
                profileVisibility: "public",
                showEmail: false,
                showPhone: false,
                language: "en",
                theme: "system",
            },
        })
    } catch (error: any) {
        console.error("Get settings error:", error)
        if (error.status === 401) {
            return error
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await requireAuth(request)
        const userId = getUserId(session)

        const body = await request.json()
        const settings = settingsSchema.parse(body)

        // For now, just return success
        // In the future, you can add a user_settings table to persist these
        // Example:
        // await db.userSettings.upsert({
        //   where: { userId },
        //   update: settings,
        //   create: { userId, ...settings },
        // })

        return NextResponse.json({
            success: true,
            message: "Settings updated",
            settings,
        })
    } catch (error: any) {
        console.error("Update settings error:", error)
        if (error.status === 401) {
            return error
        }
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid settings data", details: error.errors },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

