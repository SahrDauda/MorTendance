import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"

const requestSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, "password_reset_request", 5, 60_000)
  if (!limited.ok) return limited.response

  try {
    const body = await request.json()
    const { email } = requestSchema.parse(body)

    const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true, name: true } })

    // Always return success to avoid user enumeration
    if (!user) {
      return NextResponse.json({ message: "If that account exists, a reset link has been created." })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    // TODO: Integrate email provider. For now, return token in response for dev use.
    return NextResponse.json({
      message: "If that account exists, a reset link has been created.",
      // Remove this in production:
      token,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Password reset request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

