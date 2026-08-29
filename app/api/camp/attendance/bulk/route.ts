import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      session = "Tuesday — Bus Boarding (Departure Check-In)",
      action, // "MARK_ALL" | "RESET_ALL" | "MARK_GROUP" | "MARK_BRANCH" | "SYNC_OFFLINE_QUEUE"
      targetName,
      items, // array of QueuedCheckIn
    } = body

    // 1. Handle Offline Queue Batch Sync
    if (action === "SYNC_OFFLINE_QUEUE" && Array.isArray(items) && items.length > 0) {
      const updates = items.map((item: any) => {
        const recordTime = item.scannedAt ? new Date(item.scannedAt) : new Date()
        return db.campAttendance.upsert({
          where: {
            memberId_session: {
              memberId: item.memberId,
              session: item.session || session,
            },
          },
          update: {
            isPresent: item.isPresent !== false,
            isLate: Boolean(item.isLate),
            scannedAt: recordTime,
            recordedBy: item.recordedBy || undefined,
          },
          create: {
            memberId: item.memberId,
            session: item.session || session,
            isPresent: item.isPresent !== false,
            isLate: Boolean(item.isLate),
            scannedAt: recordTime,
            recordedBy: item.recordedBy || null,
          },
        })
      })

      await db.$transaction(updates)

      return NextResponse.json({
        success: true,
        message: `Successfully synchronized ${items.length} offline check-ins to database`,
        syncedCount: items.length,
        syncedIds: items.map((i: any) => i.id),
      })
    }

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

    const updates = members.map((m: { id: string }) =>
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
