import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const session = searchParams.get("session") || "Tuesday — Bus Boarding (Departure Check-In)"

    // 1. Fetch all registered camp members
    const members = await db.campMember.findMany({
      orderBy: [{ branch: "asc" }, { fullName: "asc" }],
      select: {
        id: true,
        badgeId: true,
        fullName: true,
        phone: true,
        gender: true,
        branch: true,
        caregroup: true,
        room: true,
        position: true,
        paid: true,
      },
    })

    // 2. Fetch attendance records for this specific session
    const attendanceRecords = await db.campAttendance.findMany({
      where: {
        session,
        isPresent: true,
      },
      select: {
        id: true,
        memberId: true,
        session: true,
        isPresent: true,
        scannedAt: true,
      },
    })

    // 3. Map attendance status to members
    const attendanceMap = new Map<string, { id: string; scannedAt: Date }>()
    for (const record of attendanceRecords) {
      attendanceMap.set(record.memberId, {
        id: record.id,
        scannedAt: record.scannedAt,
      })
    }

    let presentCount = 0
    const branchBreakdown: Record<string, { total: number; present: number }> = {}
    const groupBreakdown: Record<string, { total: number; present: number }> = {}

    const roster = members.map((member) => {
      const att = attendanceMap.get(member.id)
      const isPresent = Boolean(att)
      if (isPresent) presentCount++

      // Branch stats
      const branchKey = (member.branch || "Unassigned").trim()
      if (!branchBreakdown[branchKey]) {
        branchBreakdown[branchKey] = { total: 0, present: 0 }
      }
      branchBreakdown[branchKey].total++
      if (isPresent) branchBreakdown[branchKey].present++

      // Group stats
      const groupKey = (member.caregroup || "Unassigned").trim()
      if (!groupBreakdown[groupKey]) {
        groupBreakdown[groupKey] = { total: 0, present: 0 }
      }
      groupBreakdown[groupKey].total++
      if (isPresent) groupBreakdown[groupKey].present++

      return {
        ...member,
        isPresent,
        scannedAt: att ? att.scannedAt.toISOString() : null,
        attendanceId: att ? att.id : null,
      }
    })

    const totalMembers = members.length
    const absentCount = totalMembers - presentCount
    const presentPercent = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        session,
        members: roster,
        summary: {
          totalMembers,
          presentCount,
          absentCount,
          presentPercent,
          branchBreakdown,
          groupBreakdown,
        },
      },
    })
  } catch (error: any) {
    console.error("Error fetching camp attendance:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch attendance" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      memberId,
      badgeOrId,
      session = "Tuesday — Bus Boarding (Departure Check-In)",
      isPresent,
      toggle = false,
    } = body

    let targetMember: any = null

    if (memberId) {
      targetMember = await db.campMember.findUnique({
        where: { id: memberId },
      })
    } else if (badgeOrId) {
      const cleanQuery = badgeOrId.trim()
      targetMember = await db.campMember.findFirst({
        where: {
          OR: [
            { id: cleanQuery },
            { badgeId: { equals: cleanQuery, mode: "insensitive" } },
            { phone: { equals: cleanQuery } },
            { fullName: { equals: cleanQuery, mode: "insensitive" } },
          ],
        },
      })
    }

    if (!targetMember) {
      return NextResponse.json(
        { success: false, error: `Attendee not found matching "${badgeOrId || memberId}"` },
        { status: 404 }
      )
    }

    // Check existing attendance
    const existing = await db.campAttendance.findUnique({
      where: {
        memberId_session: {
          memberId: targetMember.id,
          session,
        },
      },
    })

    let willBePresent = true

    if (typeof isPresent === "boolean") {
      willBePresent = isPresent
    } else if (toggle) {
      willBePresent = !existing || !existing.isPresent
    }

    if (willBePresent) {
      const record = await db.campAttendance.upsert({
        where: {
          memberId_session: {
            memberId: targetMember.id,
            session,
          },
        },
        update: {
          isPresent: true,
          scannedAt: new Date(),
        },
        create: {
          memberId: targetMember.id,
          session,
          isPresent: true,
          scannedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: `Checked in ${targetMember.fullName} (${targetMember.badgeId})`,
        data: {
          ...record,
          member: targetMember,
          isPresent: true,
        },
      })
    } else {
      // Remove or set false
      if (existing) {
        await db.campAttendance.delete({
          where: { id: existing.id },
        })
      }

      return NextResponse.json({
        success: true,
        message: `Unchecked ${targetMember.fullName} (${targetMember.badgeId})`,
        data: {
          member: targetMember,
          isPresent: false,
        },
      })
    }
  } catch (error: any) {
    console.error("Error recording camp check-in:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to record check-in" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")
    const session = searchParams.get("session")

    if (!memberId || !session) {
      return NextResponse.json(
        { success: false, error: "memberId and session are required" },
        { status: 400 }
      )
    }

    await db.campAttendance.deleteMany({
      where: {
        memberId,
        session,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Attendance record removed",
    })
  } catch (error: any) {
    console.error("Error deleting camp attendance:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete attendance" },
      { status: 500 }
    )
  }
}
