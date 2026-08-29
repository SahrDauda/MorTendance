import { NextResponse } from "next/server"
import { db } from "@/lib/db"

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
      const position =
        String(item.position || item.role || "Member").toLowerCase() === "leader"
          ? "Leader"
          : "Member"

      // Branch logic: Headquarters, Eastern, Bo. Any group not Eastern/Bo is Headquarters
      let branch = item.branch ? item.branch.trim() : ""
      const groupOrMinistry = (item.group || item.ministryGroup || "").trim()

      if (!branch || branch === "AUTO") {
        if (groupOrMinistry.toLowerCase() === "eastern" || branch.toLowerCase() === "eastern") {
          branch = "Eastern"
        } else if (groupOrMinistry.toLowerCase() === "bo" || branch.toLowerCase() === "bo") {
          branch = "Bo"
        } else {
          branch = "Headquarters"
        }
      }

      // Camp Team mapping (DOX -> Doxasmus, HUIO -> Huiothesia, etc.)
      const teamMap: { [k: string]: string } = {
        DOX: "Doxasmus",
        HUIO: "Huiothesia",
        DIK: "Dikaiosis",
        HAG: "Hagiasmos",
        PAL: "Paligenesia",
      }
      let rawTeam = (item.caregroup || item.campTeam || "").trim().toUpperCase()
      let assignedGroup = teamMap[rawTeam] || (item.caregroup ? item.caregroup.trim() : null)
      if (assignedGroup === "AUTO" || assignedGroup === "NONE") {
        assignedGroup = null
      }

      // Room assignment if explicitly provided
      const assignedRoom =
        item.room &&
        item.room !== "AUTO" &&
        item.room !== "NONE" &&
        item.room !== "UNASSIGNED"
          ? item.room.trim()
          : null

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
