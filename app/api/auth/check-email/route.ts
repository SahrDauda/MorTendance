import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = schema.parse(body)

    const existing = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true },
    })

    return NextResponse.json({ exists: !!existing })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    console.error("[Check Email] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


