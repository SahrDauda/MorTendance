import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const session = searchParams.get("session")

    const where: any = {}
    if (session && session !== "ALL") where.session = session

    const records = await db.campAttendance.findMany({
      where,
      orderBy: { scannedAt: "desc" },
      include: {
        member: {
          select: {
            id: true,
            badgeId: true,
            fullName: true,
            phone: true,
            branch: true,
            caregroup: true,
            room: true,
            position: true,
            paid: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: records, total: records.length })
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
    const { badgeOrId, session = "General Session" } = body

    if (!badgeOrId) {
      return NextResponse.json(
        { success: false, error: "Badge ID or Member ID is required" },
        { status: 400 }
      )
    }

    const cleanQuery = badgeOrId.trim()
    const member = await db.campMember.findFirst({
      where: {
        OR: [
          { id: cleanQuery },
          { badgeId: { equals: cleanQuery, mode: "insensitive" } },
        ],
      },
    })

    if (!member) {
      return NextResponse.json(
        { success: false, error: `Attendee with ID "${cleanQuery}" not found` },
        { status: 404 }
      )
    }

    const attendance = await db.campAttendance.upsert({
      where: {
        memberId_session: {
          memberId: member.id,
          session,
        },
      },
      update: {
        isPresent: true,
        scannedAt: new Date(),
      },
      create: {
        memberId: member.id,
        session,
        isPresent: true,
        scannedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: `Checked in ${member.fullName} (${member.badgeId}) for ${session}`,
      data: {
        ...attendance,
        member,
      },
    })
  } catch (error: any) {
    console.error("Error recording camp check-in:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to record check-in" },
      { status: 500 }
    )
  }
}
