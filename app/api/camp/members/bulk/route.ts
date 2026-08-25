import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { assignRandomCampRoom } from "@/lib/campRoomAssignment"
import { assignRandomCampGroup } from "@/lib/campGroupAssignment"

export const dynamic = "force-dynamic"

// Helper to format +232 phone number
const formatPhone = (raw?: string | null) => {
  if (!raw) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  const cleaned = trimmed.replace(/[^\d+]/g, "")
  if (!cleaned) return null
  if (cleaned.startsWith("+232")) return cleaned
  if (cleaned.startsWith("232")) return `+${cleaned}`
  if (cleaned.startsWith("0")) return `+232${cleaned.slice(1)}`
  return `+232${cleaned}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { attendees } = body

    if (!Array.isArray(attendees) || attendees.length === 0) {
      return NextResponse.json(
        { success: false, error: "No attendees data provided for bulk import." },
        { status: 400 }
      )
    }

    // Filter out invalid rows (missing fullName)
    const validAttendees = attendees.filter(
      (a: any) => a && typeof a.fullName === "string" && a.fullName.trim().length > 0
    )

    if (validAttendees.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid attendees found with a Full Name." },
        { status: 400 }
      )
    }

    // Determine the highest existing MOR Badge ID
    const allExistingMembers = await db.campMember.findMany({
      select: { badgeId: true },
    })

    let maxNum = 0
    for (const m of allExistingMembers) {
      const match = m.badgeId.match(/\d+/)
      if (match) {
        const num = parseInt(match[0], 10)
        if (num > maxNum) maxNum = num
      }
    }

    const createdMembers = []
    let currentBadgeNumber = maxNum + 1

    for (const item of validAttendees) {
      const normGender =
        String(item.gender || "Male").toLowerCase() === "female" ? "Female" : "Male"
      const fullName = item.fullName.trim()
      const phone = formatPhone(item.phone)
      const branch = item.branch ? item.branch.trim() : null
      const caregroup = item.caregroup || item.group ? (item.caregroup || item.group).trim() : null
      const position =
        String(item.position || item.role || "Member").toLowerCase() === "leader"
          ? "Leader"
          : "Member"

      // Group assignment: use provided or auto-assign balanced group
      let assignedGroup = caregroup
      if (!assignedGroup || assignedGroup.toUpperCase() === "AUTO") {
        assignedGroup = await assignRandomCampGroup()
      }

      // Room assignment: use provided or auto-assign matching gender
      let assignedRoom = item.room ? item.room.trim() : ""
      if (!assignedRoom || assignedRoom.toUpperCase() === "AUTO") {
        assignedRoom =
          (await assignRandomCampRoom({
            gender: normGender,
            branch,
            position,
          })) || ""
      }

      const badgeId = `MOR-${String(currentBadgeNumber).padStart(3, "0")}`
      currentBadgeNumber++

      const newMember = await db.campMember.create({
        data: {
          badgeId,
          fullName,
          phone,
          gender: normGender,
          branch,
          caregroup: assignedGroup || null,
          room: assignedRoom || null,
          position,
          paid: true,
          paidAmount: 300,
          paymentClaimed: true,
          couponNum: 0,
          foodReceived: false,
        },
      })

      createdMembers.push(newMember)
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully imported ${createdMembers.length} attendees.`,
        count: createdMembers.length,
        data: createdMembers,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error bulk creating camp attendees:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to bulk import camp attendees" },
      { status: 500 }
    )
  }
}
