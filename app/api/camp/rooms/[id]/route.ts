import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Get original room to handle renaming
    const existingRoom = await db.campRoom.findUnique({ where: { id } })
    if (!existingRoom) {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
    }

    const updated = await db.campRoom.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.gender && { gender: body.gender }),
        ...(body.capacity !== undefined && { capacity: Number(body.capacity) }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    })

    // If room name changed, update allocated members
    if (body.name && body.name.trim() !== existingRoom.name) {
      await db.campMember.updateMany({
        where: { room: existingRoom.name },
        data: { room: body.name.trim() },
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error("Error updating room:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update room" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existingRoom = await db.campRoom.findUnique({ where: { id } })
    if (!existingRoom) {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 })
    }

    // Unassign members allocated to this room
    await db.campMember.updateMany({
      where: { room: existingRoom.name },
      data: { room: null },
    })

    await db.campRoom.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Room deleted and members unassigned" })
  } catch (error: any) {
    console.error("Error deleting room:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete room" },
      { status: 500 }
    )
  }
}
