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

    // 1. Fetch all rooms
    const rooms = await db.campRoom.findMany({
      orderBy: { name: "asc" },
    })

    if (rooms.length === 0) {
      return NextResponse.json(
        { success: false, error: "No lodging rooms found. Please create camp rooms first." },
        { status: 400 }
      )
    }

    // 2. Fetch existing room assignments if not forcing all
    const existingOccupants = forceAll
      ? []
      : await db.campMember.findMany({
          where: { room: { not: null } },
          select: { id: true, room: true, branch: true },
        })

    // Calculate current occupancy per room
    const roomOccupancyMap = new Map<string, number>()
    rooms.forEach((r: any) => roomOccupancyMap.set(r.name, 0))
    existingOccupants.forEach((m: any) => {
      if (m.room && roomOccupancyMap.has(m.room)) {
        roomOccupancyMap.set(m.room, (roomOccupancyMap.get(m.room) || 0) + 1)
      }
    })

    // 3. Find members to assign
    const where = forceAll ? {} : { OR: [{ room: null }, { room: "" }] }
    const membersToAssign: any[] = await db.campMember.findMany({
      where,
    })

    if (membersToAssign.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All attendees already have lodging rooms assigned.",
        assignedCount: 0,
      })
    }

    // Separate members by gender and shuffle for random distribution
    const maleMembers: any[] = shuffle(
      membersToAssign.filter((m: any) => (m.gender || "Male").toLowerCase() === "male")
    )
    const femaleMembers: any[] = shuffle(
      membersToAssign.filter((m: any) => (m.gender || "").toLowerCase() === "female")
    )

    // Separate rooms by gender
    const maleRooms = rooms.filter((r: any) => (r.gender || "Male").toLowerCase() === "male")
    const femaleRooms = rooms.filter((r: any) => (r.gender || "").toLowerCase() === "female")

    const updates: any[] = []
    let maleAssigned = 0
    let femaleAssigned = 0

    // Assign Male members randomly to Male rooms with available space
    for (const member of maleMembers) {
      // Find eligible male rooms with capacity
      const eligibleRooms = maleRooms.filter((r: any) => {
        const currentOcc = roomOccupancyMap.get(r.name) || 0
        return currentOcc < r.capacity
      })

      if (eligibleRooms.length > 0) {
        // Find minimum occupancy among eligible rooms to keep load balanced while randomizing
        const minOcc = Math.min(
          ...eligibleRooms.map((r: any) => roomOccupancyMap.get(r.name) || 0)
        )
        const candidates = eligibleRooms.filter(
          (r: any) => (roomOccupancyMap.get(r.name) || 0) <= minOcc + 2
        )
        const chosenRoom = candidates[Math.floor(Math.random() * candidates.length)]

        updates.push(
          db.campMember.update({
            where: { id: member.id },
            data: { room: chosenRoom.name },
          })
        )
        const current = roomOccupancyMap.get(chosenRoom.name) || 0
        roomOccupancyMap.set(chosenRoom.name, current + 1)
        maleAssigned++
      } else if (maleRooms.length > 0) {
        // Fallback: lowest occupancy male room
        const sorted = [...maleRooms].sort(
          (a, b) => (roomOccupancyMap.get(a.name) || 0) - (roomOccupancyMap.get(b.name) || 0)
        )
        const targetRoom = sorted[0]
        updates.push(
          db.campMember.update({
            where: { id: member.id },
            data: { room: targetRoom.name },
          })
        )
        const current = roomOccupancyMap.get(targetRoom.name) || 0
        roomOccupancyMap.set(targetRoom.name, current + 1)
        maleAssigned++
      }
    }

    // Assign Female members randomly to Female rooms with available space
    for (const member of femaleMembers) {
      const eligibleRooms = femaleRooms.filter((r: any) => {
        const currentOcc = roomOccupancyMap.get(r.name) || 0
        return currentOcc < r.capacity
      })

      if (eligibleRooms.length > 0) {
        const minOcc = Math.min(
          ...eligibleRooms.map((r: any) => roomOccupancyMap.get(r.name) || 0)
        )
        const candidates = eligibleRooms.filter(
          (r: any) => (roomOccupancyMap.get(r.name) || 0) <= minOcc + 2
        )
        const chosenRoom = candidates[Math.floor(Math.random() * candidates.length)]

        updates.push(
          db.campMember.update({
            where: { id: member.id },
            data: { room: chosenRoom.name },
          })
        )
        const current = roomOccupancyMap.get(chosenRoom.name) || 0
        roomOccupancyMap.set(chosenRoom.name, current + 1)
        femaleAssigned++
      } else if (femaleRooms.length > 0) {
        const sorted = [...femaleRooms].sort(
          (a, b) => (roomOccupancyMap.get(a.name) || 0) - (roomOccupancyMap.get(b.name) || 0)
        )
        const targetRoom = sorted[0]
        updates.push(
          db.campMember.update({
            where: { id: member.id },
            data: { room: targetRoom.name },
          })
        )
        const current = roomOccupancyMap.get(targetRoom.name) || 0
        roomOccupancyMap.set(targetRoom.name, current + 1)
        femaleAssigned++
      }
    }

    if (updates.length > 0) {
      await db.$transaction(updates)
    }

    const totalAssigned = maleAssigned + femaleAssigned
    const unassigned = membersToAssign.length - totalAssigned

    return NextResponse.json({
      success: true,
      message: `Successfully randomized & allocated ${totalAssigned} attendees across lodging rooms (${maleAssigned} Male, ${femaleAssigned} Female).`,
      assignedCount: totalAssigned,
      maleAssigned,
      femaleAssigned,
      unassignedCount: unassigned,
    })
  } catch (error: any) {
    console.error("Error auto-assigning rooms:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to auto-assign rooms" },
      { status: 500 }
    )
  }
}
