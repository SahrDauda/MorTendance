import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      session = "Tuesday — Bus Boarding (Departure Check-In)",
      action, // "MARK_ALL" | "RESET_ALL" | "MARK_GROUP" | "MARK_BRANCH"
      targetName,
    } = body

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session is required" },
        { status: 400 }
      )
    }

    if (action === "RESET_ALL") {
      await db.campAttendance.deleteMany({
        where: { session },
      })
      return NextResponse.json({
        success: true,
        message: `Reset all attendance records for ${session}`,
      })
    }

    const where: any = {}
    if (action === "MARK_GROUP" && targetName) {
      where.caregroup = targetName
    } else if (action === "MARK_BRANCH" && targetName) {
      where.branch = targetName
    }

    const members = await db.campMember.findMany({
      where,
      select: { id: true },
    })

    if (members.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No matching attendees found to update.",
        count: 0,
      })
    }

    const updates = members.map((m) =>
      db.campAttendance.upsert({
        where: {
          memberId_session: {
            memberId: m.id,
            session,
          },
        },
        update: {
          isPresent: true,
          scannedAt: new Date(),
        },
        create: {
          memberId: m.id,
          session,
          isPresent: true,
          scannedAt: new Date(),
        },
      })
    )

    await db.$transaction(updates)

    return NextResponse.json({
      success: true,
      message: `Marked ${members.length} attendees present for ${session}`,
      count: members.length,
    })
  } catch (error: any) {
    console.error("Error in bulk attendance action:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to execute bulk action" },
      { status: 500 }
    )
  }
}
