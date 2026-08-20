import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [groups, members] = await Promise.all([
      db.campGroup.findMany({
        orderBy: { name: "asc" },
      }),
      db.campMember.findMany({
        where: { caregroup: { not: null } },
        select: { caregroup: true },
      }),
    ])

    const data = groups.map((g: any) => {
      const memberCount = members.filter((m: any) => m.caregroup === g.name).length
      return {
        id: g.id,
        name: g.name,
        leader: g.leader || null,
        color: g.color || null,
        createdAt: g.createdAt,
        memberCount,
      }
    })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error fetching camp groups:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch camp groups" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, leader, color } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Group name is required" },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()

    // Upsert into CampGroup table
    const group = await db.campGroup.upsert({
      where: { name: trimmedName },
      update: {
        leader: leader ? leader.trim() : null,
        color: color ? color.trim() : null,
      },
      create: {
        name: trimmedName,
        leader: leader ? leader.trim() : null,
        color: color ? color.trim() : null,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          ...group,
          memberCount: 0,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating camp group:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save camp group" },
      { status: 500 }
    )
  }
}
