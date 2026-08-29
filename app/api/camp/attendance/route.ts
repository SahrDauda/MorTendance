import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSessionDef, isCheckInLate } from "@/lib/campSchedule"

export const dynamic = "force-dynamic"

interface MemberSelect {
  id: string
  badgeId: string
  fullName: string
  phone: string | null
  gender: string
  branch: string | null
  caregroup: string | null
  room: string | null
  position: string
  paid: boolean
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const session =
      searchParams.get("session") || "Tuesday — Bus Boarding (Departure Check-In)"

    // 1. Fetch all registered camp members
    const members: MemberSelect[] = await db.campMember.findMany({
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
    let attendanceRecords: any[] = []
    try {
      attendanceRecords = await db.campAttendance.findMany({
        where: {
          session,
          isPresent: true,
        },
      })
    } catch (attErr) {
      console.warn("Notice: Fetching attendance records:", attErr)
      attendanceRecords = []
    }

    // 3. Map attendance status to members
    const attendanceMap = new Map<
      string,
      { id: string; isLate: boolean; scannedAt: Date; recordedBy?: string | null }
    >()
    for (const record of attendanceRecords) {
      attendanceMap.set(record.memberId, {
        id: record.id,
        isLate: Boolean(record.isLate),
        scannedAt: record.scannedAt || new Date(),
        recordedBy: record.recordedBy || null,
      })
    }

    let presentCount = 0
    let onTimeCount = 0
    let lateCount = 0

    const branchBreakdown: Record<
      string,
      { total: number; present: number; onTime: number; late: number }
    > = {}
    const groupBreakdown: Record<
      string,
      { total: number; present: number; onTime: number; late: number }
    > = {}

    const roster = members.map((member: MemberSelect) => {
      const att = attendanceMap.get(member.id)
      const isPresent = Boolean(att)
      const isLate = att ? att.isLate : false

      if (isPresent) {
        presentCount++
        if (isLate) {
          lateCount++
        } else {
          onTimeCount++
        }
      }

      // Branch stats
      const branchKey = (member.branch || "Unassigned").trim()
      if (!branchBreakdown[branchKey]) {
        branchBreakdown[branchKey] = { total: 0, present: 0, onTime: 0, late: 0 }
      }
      branchBreakdown[branchKey].total++
      if (isPresent) {
        branchBreakdown[branchKey].present++
        if (isLate) branchBreakdown[branchKey].late++
        else branchBreakdown[branchKey].onTime++
      }

      // Group stats
      const groupKey = (member.caregroup || "Unassigned").trim()
      if (!groupBreakdown[groupKey]) {
        groupBreakdown[groupKey] = { total: 0, present: 0, onTime: 0, late: 0 }
      }
      groupBreakdown[groupKey].total++
      if (isPresent) {
        groupBreakdown[groupKey].present++
        if (isLate) groupBreakdown[groupKey].late++
        else groupBreakdown[groupKey].onTime++
      }

      return {
        ...member,
        isPresent,
        isLate,
        scannedAt: att ? new Date(att.scannedAt).toISOString() : null,
        recordedBy: att ? att.recordedBy : null,
        attendanceId: att ? att.id : null,
      }
    })

    const totalMembers = members.length
    const absentCount = totalMembers - presentCount
    const presentPercent =
      totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0

    const sessionDef = getSessionDef(session)

    return NextResponse.json({
      success: true,
      data: {
        session,
        sessionDef: sessionDef || null,
        members: roster,
        summary: {
          totalMembers,
          presentCount,
          onTimeCount,
          lateCount,
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
      isLate,
      recordedBy,
      scannedAt,
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

    const recordTime = scannedAt ? new Date(scannedAt) : new Date()
    let willBePresent = true
    // Automatically calculate isLate based on standard Sierra Leone time (UTC+0) if not explicitly set
    let willBeLate =
      typeof isLate === "boolean" ? isLate : isCheckInLate(session, recordTime)

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
          isLate: willBeLate,
          scannedAt: recordTime,
          recordedBy: recordedBy || undefined,
        },
        create: {
          memberId: targetMember.id,
          session,
          isPresent: true,
          isLate: willBeLate,
          scannedAt: recordTime,
          recordedBy: recordedBy || null,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Checked in ${targetMember.fullName} (${targetMember.badgeId})${willBeLate ? " [LATE]" : " [ON TIME]"}`,
        data: {
          ...record,
          member: targetMember,
          isPresent: true,
          isLate: willBeLate,
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
        message: `Marked absent: ${targetMember.fullName} (${targetMember.badgeId})`,
        data: {
          member: targetMember,
          isPresent: false,
          isLate: false,
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
