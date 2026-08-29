import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, leader, color } = body

    const existingGroup = await db.campGroup.findUnique({
      where: { id },
    })

    if (!existingGroup) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      )
    }

    const updated = await db.campGroup.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        leader: leader !== undefined ? (leader ? leader.trim() : null) : undefined,
        color: color !== undefined ? (color ? color.trim() : null) : undefined,
      },
    })

    // If name changed, update all members in this caregroup
    if (name && name.trim() !== existingGroup.name) {
      await db.campMember.updateMany({
        where: { caregroup: existingGroup.name },
        data: { caregroup: name.trim() },
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error("Error updating camp group:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update group" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existingGroup = await db.campGroup.findUnique({
      where: { id },
    })

    if (!existingGroup) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      )
    }

    // Unassign members in this group
    await db.campMember.updateMany({
      where: { caregroup: existingGroup.name },
      data: { caregroup: null },
    })

    await db.campGroup.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: `Group "${existingGroup.name}" deleted successfully`,
    })
  } catch (error: any) {
    console.error("Error deleting camp group:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete group" },
      { status: 500 }
    )
  }
}
