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
        managedGroups: { select: { id: true } },
        managedBranch: { select: { id: true } },
      },
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const groupIds = user.managedGroups.map((g) => g.id)
    const branchId = user.managedBranch?.id
    const isGlobal = ["SUPER_ADMIN", "ADMIN"].includes(user.role)

    const sessionWhere: any = {}
    if (!isGlobal) {
      if (groupIds.length > 0) sessionWhere.groupId = { in: groupIds }
      else if (branchId) sessionWhere.branchId = branchId
    }

    const memberWhere: any = {}
    if (!isGlobal) {
      if (groupIds.length > 0) memberWhere.groupId = { in: groupIds }
      else if (branchId) memberWhere.branchId = branchId
    }

    const [sessions, members] = await Promise.all([
      db.attendanceSession.findMany({
        where: sessionWhere,
        include: {
          group: { select: { name: true } },
          branch: { select: { name: true } },
          records: { select: { isPresent: true } },
        },
        orderBy: { date: "desc" },
        take: 20,
      }),
      db.member.findMany({
        where: memberWhere,
        select: { id: true, name: true, status: true },
        orderBy: { name: "asc" },
      }),
    ])

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        type: s.type,
        date: s.date.toISOString().split("T")[0],
        groupId: s.groupId ?? null,
        groupName: s.group?.name ?? null,
        branchId: s.branchId,
        branchName: s.branch.name,
        presentCount: s.records.filter((r) => r.isPresent).length,
        totalCount: s.records.length,
        status: s.status,
      })),
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        status: m.status,
      })),
    })
  } catch (error: any) {
    console.error("[Mobile] attendance sessions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
