import { NextResponse } from "next/server"
import { db } from "@/lib/db"

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { forceAll = false } = body

    // 1. Fetch real groups from CampGroup table
    const groups = await db.campGroup.findMany({
      orderBy: { name: "asc" },
    })

    if (groups.length === 0) {
      return NextResponse.json(
        { success: false, error: "No camp groups found. Please create at least one group first." },
        { status: 400 }
      )
    }

    const where = forceAll ? {} : { OR: [{ caregroup: null }, { caregroup: "" }] }
    const membersToAssign: any[] = await db.campMember.findMany({
      where,
    })

    if (membersToAssign.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All attendees already have groups assigned.",
        assignedCount: 0,
      })
    }

    // Shuffle attendees for random and fair group distribution
    const shuffledMembers = shuffle(membersToAssign)
    const updates = shuffledMembers.map((member: any, index: number) => {
      const assignedGroup = groups[index % groups.length].name
      return db.campMember.update({
        where: { id: member.id },
        data: { caregroup: assignedGroup },
      })
    })

    await db.$transaction(updates)

    return NextResponse.json({
      success: true,
      message: `Successfully distributed ${membersToAssign.length} attendees across ${groups.length} groups.`,
      assignedCount: membersToAssign.length,
    })
  } catch (error: any) {
    console.error("Error auto-assigning groups:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to auto-assign groups" },
      { status: 500 }
    )
  }
}
