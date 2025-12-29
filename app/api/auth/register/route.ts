import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

export async function POST(request: NextRequest) {
  try {
    const limited = await rateLimit(request, "auth_register", 5, 60_000)
    if (!limited.ok) return limited.response

    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const email = validatedData.email.toLowerCase()

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 10)

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name: validatedData.name,
        passwordHash,
        role: "STUDENT",
        learnerProfile: {
          create: {
            skillsMatchPercentage: 0,
            verificationStatus: "UNVERIFIED",
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

