import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { memberId, roomName } = body

    if (!memberId) {
      return NextResponse.json(
        { success: false, error: "memberId is required" },
        { status: 400 }
      )
    }

    // If roomName is provided, verify room capacity
    if (roomName) {
      const targetRoom = await db.campRoom.findUnique({
        where: { name: roomName },
      })

      if (!targetRoom) {
        return NextResponse.json(
          { success: false, error: "Specified room not found" },
          { status: 404 }
        )
      }

      const occupantCount = await db.campMember.count({
        where: { room: roomName },
      })

      if (occupantCount >= targetRoom.capacity) {
        return NextResponse.json(
          { success: false, error: `Room ${roomName} is already at full capacity (${targetRoom.capacity}/${targetRoom.capacity})` },
          { status: 400 }
        )
      }
    }

    const updated = await db.campMember.update({
      where: { id: memberId },
      data: { room: roomName || null },
    })

    return NextResponse.json({
      success: true,
      message: roomName ? `Assigned to ${roomName}` : "Unassigned from room",
      data: updated,
    })
  } catch (error: any) {
    console.error("Error assigning room:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to assign room" },
      { status: 500 }
    )
  }
}
