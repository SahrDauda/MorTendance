import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req.headers.get("Authorization"))
  const payload = token ? await verifyMobileToken(token) : null
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      include: {
        managedBranch: { select: { id: true } },
      },
    })

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const isGlobal = ["SUPER_ADMIN", "ADMIN"].includes(user.role)

    const where: { branchId?: string } = {}
    if (!isGlobal && user.managedBranch?.id) {
      where.branchId = user.managedBranch.id
    }

    const groups = await db.ministryGroup.findMany({
      where,
      include: {
        branch: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        branchId: g.branchId ?? null,
        branchName: g.branch?.name ?? null,
      })),
    })
  } catch (error: unknown) {
    console.error("[Mobile] groups GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
