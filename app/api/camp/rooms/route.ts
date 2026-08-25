import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

const DEFAULT_AYAC_ROOMS = [
  // 7 Male Rooms
  { name: "Gethsemane", gender: "Male", capacity: 30, notes: "Male Lodging" },
  { name: "Zion", gender: "Male", capacity: 30, notes: "Male Lodging" },
  { name: "Moriah", gender: "Male", capacity: 30, notes: "Male Lodging" },
  { name: "Sinai", gender: "Male", capacity: 30, notes: "Male Lodging" },
  { name: "Carmel", gender: "Male", capacity: 30, notes: "Male Lodging" },
  { name: "Horeb", gender: "Male", capacity: 30, notes: "Male Lodging" },
  { name: "Patmos", gender: "Male", capacity: 30, notes: "Male Lodging" },

  // 12 Female Rooms
  { name: "Bethel", gender: "Female", capacity: 30, notes: "Female Lodging" },
  { name: "Bethany", gender: "Female", capacity: 30, notes: "Female Lodging" },
  { name: "Shiloh", gender: "Female", capacity: 30, notes: "Female Lodging" },
  { name: "Eden", gender: "Female", capacity: 30, notes: "Female Lodging" },
  { name: "Goshen", gender: "Female", capacity: 30, notes: "Female Lodging" },
  { name: "Hebron", gender: "Female", capacity: 30, notes: "Female Lodging" },
  { name: "Bethesda", gender: "Female", capacity: 30, notes: "Female Lodging" },
  { name: "Siloam", gender: "Female", capacity: 30, notes: "Female Lodging" },
  { name: "Sychar", gender: "Female", capacity: 30, notes: "Female Lodging" },
  { name: "Emmaus", gender: "Female", capacity: 30, notes: "Female Lodging" },
  { name: "Peniel", gender: "Female", capacity: 30, notes: "Female Lodging" },
  { name: "Tabor", gender: "Female", capacity: 30, notes: "Female Lodging" },
]

export async function GET() {
  try {
    const existingCount = await db.campRoom.count()
    if (existingCount === 0) {
      for (const r of DEFAULT_AYAC_ROOMS) {
        await db.campRoom.upsert({
          where: { name: r.name },
          update: {},
          create: r,
        })
      }
    }

    const [rooms, members] = await Promise.all([
      db.campRoom.findMany({
        orderBy: [{ gender: "asc" }, { name: "asc" }],
      }),
      db.campMember.findMany({
        where: {
          room: { not: null },
        },
        select: {
          id: true,
          badgeId: true,
          fullName: true,
          gender: true,
          phone: true,
          branch: true,
          caregroup: true,
          room: true,
          position: true,
        },
      }),
    ])

    const formattedRooms = rooms.map((room: any) => {
      const occupants = members.filter((m: any) => m.room === room.name)
      return {
        ...room,
        occupied: occupants.length,
        available: Math.max(0, room.capacity - occupants.length),
        occupants,
      }
    })

    return NextResponse.json({ success: true, data: formattedRooms })
  } catch (error: any) {
    console.error("Error fetching camp rooms:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch rooms" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, gender = "Male", capacity = 30, leader, assistant, notes } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Room name is required" },
        { status: 400 }
      )
    }

    const room = await db.campRoom.create({
      data: {
        name: name.trim(),
        gender,
        capacity: Number(capacity) || 30,
        leader: leader ? leader.trim() : null,
        assistant: assistant ? assistant.trim() : null,
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, data: room }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating camp room:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create room" },
      { status: 500 }
    )
  }
}
