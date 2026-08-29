import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { assignRandomCampRoom } from "@/lib/campRoomAssignment"
import { assignRandomCampGroup } from "@/lib/campGroupAssignment"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const branch = searchParams.get("branch")
    const caregroup = searchParams.get("caregroup")
    const room = searchParams.get("room")
    const gender = searchParams.get("gender")
    const paid = searchParams.get("paid")

    const where: any = {}

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { badgeId: { contains: search, mode: "insensitive" } },
      ]
    }

    if (branch && branch !== "ALL") where.branch = branch
    if (caregroup && caregroup !== "ALL") where.caregroup = caregroup
    if (room && room !== "ALL") where.room = room
    if (gender && gender !== "ALL") where.gender = gender
    if (paid && paid !== "ALL") where.paid = paid === "true"

    const members = await db.campMember.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        attendances: {
          select: {
            session: true,
            scannedAt: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: members, total: members.length })
  } catch (error: any) {
    console.error("Error fetching camp members:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch camp members" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      fullName,
      phone,
      gender = "Male",
      branch,
      caregroup,
      room,
      position = "Member",
      paid = false,
      paidAmount = 0,
      paymentClaimed = false,
      couponNum = 0,
      foodReceived = false,
    } = body

    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { success: false, error: "Full Name is required" },
        { status: 400 }
      )
    }

    // Determine room: Auto-assign ONLY for Members. Leaders are assigned manually by Admin.
    let assignedRoom = room && room !== "AUTO" && room !== "NONE" ? room.trim() : null
    if (!assignedRoom && position !== "Leader") {
      assignedRoom = await assignRandomCampRoom({
        gender,
        branch,
        position,
      })
    }

    // Determine group: Only use provided group. If none provided or "AUTO", leave as null for Admin to assign.
    let assignedGroup = caregroup && caregroup !== "AUTO" && caregroup !== "NONE" ? caregroup.trim() : null

    // Generate next MOR Badge ID (e.g. MOR-001)
    const lastMember = await db.campMember.findFirst({
      orderBy: { createdAt: "desc" },
      select: { badgeId: true },
    })

    let nextNumber = 1
    if (lastMember?.badgeId) {
      const match = lastMember.badgeId.match(/\d+/)
      if (match) {
        nextNumber = parseInt(match[0], 10) + 1
      }
    }

    let badgeId = `MOR-${String(nextNumber).padStart(3, "0")}`
    // Ensure uniqueness
    let existingBadge = await db.campMember.findUnique({ where: { badgeId } })
    while (existingBadge) {
      nextNumber++
      badgeId = `MOR-${String(nextNumber).padStart(3, "0")}`
      existingBadge = await db.campMember.findUnique({ where: { badgeId } })
    }

    const newMember = await db.campMember.create({
      data: {
        badgeId,
        fullName: fullName.trim(),
        phone: phone ? phone.trim() : null,
        gender,
        branch: branch || null,
        caregroup: assignedGroup || null,
        room: assignedRoom || null,
        position: position || "Member",
        paid: true,
        paidAmount: 300,
        paymentClaimed: true,
        couponNum: Number(couponNum) || 0,
        foodReceived: Boolean(foodReceived),
      },
    })

    return NextResponse.json({ success: true, data: newMember }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating camp member:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create camp member" },
      { status: 500 }
    )
  }
}
