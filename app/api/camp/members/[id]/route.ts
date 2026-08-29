import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const member = await db.campMember.findFirst({
      where: {
        OR: [{ id }, { badgeId: id }],
      },
      include: {
        attendances: true,
      },
    })

    if (!member) {
      return NextResponse.json(
        { success: false, error: "Camp member not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: member })
  } catch (error: any) {
    console.error("Error fetching camp member:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch member" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updated = await db.campMember.update({
      where: { id },
      data: {
        ...(body.fullName !== undefined && { fullName: body.fullName.trim() }),
        ...(body.phone !== undefined && { phone: body.phone ? body.phone.trim() : null }),
        ...(body.gender !== undefined && { gender: body.gender }),
        ...(body.branch !== undefined && { branch: body.branch || null }),
        ...(body.caregroup !== undefined && { caregroup: body.caregroup || null }),
        ...(body.room !== undefined && { room: body.room || null }),
        ...(body.position !== undefined && { position: body.position }),
        ...(body.goingOut !== undefined && { goingOut: Boolean(body.goingOut) }),
        ...(body.paid !== undefined && { paid: Boolean(body.paid) }),
        ...(body.paidAmount !== undefined && { paidAmount: Number(body.paidAmount) }),
        ...(body.paymentClaimed !== undefined && { paymentClaimed: Boolean(body.paymentClaimed) }),
        ...(body.couponNum !== undefined && { couponNum: Number(body.couponNum) }),
        ...(body.foodReceived !== undefined && { foodReceived: Boolean(body.foodReceived) }),
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error("Error updating camp member:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update member" },
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

    await db.campMember.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Member deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting camp member:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete member" },
      { status: 500 }
    )
  }
}
