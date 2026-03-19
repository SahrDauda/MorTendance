import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function fmtDate(d: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${months[d.getMonth()]} ${d.getDate()}`
}

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

    // ── Member count ──────────────────────────────────────────────────────
    const memberWhere: any = {}
    if (!isGlobal) {
      if (groupIds.length > 0) memberWhere.groupId = { in: groupIds }
      else if (branchId) memberWhere.branchId = branchId
    }
    const totalMembers = await db.member.count({ where: memberWhere })

    // ── Recent sessions (last 4 weeks) ────────────────────────────────────
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

    const sessionWhere: any = { date: { gte: fourWeeksAgo } }
    if (!isGlobal) {
      if (groupIds.length > 0) sessionWhere.groupId = { in: groupIds }
      else if (branchId) sessionWhere.branchId = branchId
    }

    const recentSessions = await db.attendanceSession.findMany({
      where: sessionWhere,
      include: { records: { select: { isPresent: true } } },
      orderBy: { date: "desc" },
      take: 8,
    })

    const last4 = recentSessions.slice(0, 4)

    // Present this week (latest session)
    const latestSession = recentSessions[0]
    const presentThisWeek = latestSession
      ? latestSession.records.filter((r) => r.isPresent).length
      : 0

    // Average attendance rate
    const avgRate =
      last4.length > 0
        ? last4.reduce((sum, s) => {
            const total = s.records.length
            const present = s.records.filter((r) => r.isPresent).length
            return sum + (total > 0 ? present / total : 0)
          }, 0) / last4.length
        : 0

    // Weekly trend (oldest → newest)
    const weeklyTrend = [...last4].reverse().map((s) => ({
      label: fmtDate(s.date),
      present: s.records.filter((r) => r.isPresent).length,
      total: s.records.length || totalMembers,
    }))

    // ── Sessions this month ───────────────────────────────────────────────
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const monthWhere: any = { date: { gte: startOfMonth } }
    if (!isGlobal) {
      if (groupIds.length > 0) monthWhere.groupId = { in: groupIds }
      else if (branchId) monthWhere.branchId = branchId
    }
    const totalSessions = await db.attendanceSession.count({ where: monthWhere })

    return NextResponse.json({
      totalMembers,
      presentThisWeek,
      attendanceRate: parseFloat(avgRate.toFixed(4)),
      totalSessions,
      weeklyTrend,
    })
  } catch (error: any) {
    console.error("[Mobile] dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
