import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, "password_reset", 5, 60_000)
  if (!limited.ok) return limited.response

  try {
    const body = await request.json()
    const { token, password } = resetSchema.parse(body)

    const record = await db.passwordResetToken.findUnique({
      where: { token },
      select: { id: true, userId: true, expiresAt: true, used: true },
    })

    if (!record || record.used || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await db.$transaction([
      db.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      db.passwordResetToken.update({
        where: { id: record.id },
        data: { used: true },
      }),
    ])

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Password reset error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

