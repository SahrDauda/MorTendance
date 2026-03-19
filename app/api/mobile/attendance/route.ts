import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"
import { EventType } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get("Authorization"))
  const payload = token ? await verifyMobileToken(token) : null
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { groupId, type, date, records, notes } = body

    if (!type || !date || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "type, date, and records are required" },
        { status: 400 }
      )
    }

    if (!Object.values(EventType).includes(type as EventType)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 })
    }

    // Resolve branchId
    let branchId: string | undefined
    if (groupId) {
      const group = await db.ministryGroup.findUnique({
        where: { id: groupId },
        select: { branchId: true },
      })
      branchId = group?.branchId ?? undefined
    }
    if (!branchId) {
      const user = await db.user.findUnique({
        where: { id: payload.sub },
        include: { managedBranch: { select: { id: true } } },
      })
      branchId = user?.managedBranch?.id
    }
    if (!branchId) {
      const fallback = await db.branch.findFirst({ select: { id: true } })
      branchId = fallback?.id
    }
    if (!branchId) {
      return NextResponse.json({ error: "No branch found" }, { status: 400 })
    }

    const sessionDate = new Date(date)
    sessionDate.setHours(0, 0, 0, 0)

    const result = await db.$transaction(async (tx) => {
      const existing = await tx.attendanceSession.findFirst({
        where: {
          type: type as EventType,
          date: sessionDate,
          branchId,
          groupId: groupId ?? null,
        },
      })

      let session
      if (existing) {
        if (existing.status === "COMPLETED") {
          throw new Error("Session already completed. Reopen it first.")
        }
        session = await tx.attendanceSession.update({
          where: { id: existing.id },
          data: { recorderId: payload.sub, notes: notes ?? existing.notes },
        })
        for (const r of records) {
          await tx.attendanceRecord.upsert({
            where: {
              sessionId_memberId: { sessionId: existing.id, memberId: r.memberId },
            },
            update: { isPresent: r.isPresent, isLate: r.isLate ?? false },
            create: {
              sessionId: existing.id,
              memberId: r.memberId,
              isPresent: r.isPresent,
              isLate: r.isLate ?? false,
            },
          })
        }
      } else {
        session = await tx.attendanceSession.create({
          data: {
            type: type as EventType,
            date: sessionDate,
            branchId,
            groupId: groupId ?? undefined,
            recorderId: payload.sub,
            notes: notes ?? undefined,
            records: {
              create: records.map((r: any) => ({
                memberId: r.memberId,
                isPresent: r.isPresent,
                isLate: r.isLate ?? false,
              })),
            },
          },
        })
      }
      return session
    })

    return NextResponse.json({ success: true, sessionId: result.id })
  } catch (error: any) {
    console.error("[Mobile] attendance POST error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
