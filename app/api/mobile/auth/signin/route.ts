import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { signMobileToken } from "@/lib/mobile-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        managedBranch: { select: { id: true, name: true } },
        managedGroups: { select: { id: true, name: true }, take: 1 },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = await signMobileToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    const primaryGroup = user.managedGroups[0] ?? null

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        branchId: user.managedBranch?.id ?? null,
        branchName: user.managedBranch?.name ?? null,
        groupId: primaryGroup?.id ?? null,
        groupName: primaryGroup?.name ?? null,
      },
    })
  } catch (error: any) {
    console.error("[Mobile] signin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
