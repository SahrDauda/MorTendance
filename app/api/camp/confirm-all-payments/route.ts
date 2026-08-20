import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST() {
  try {
    const result = await db.campMember.updateMany({
      where: { paid: false },
      data: {
        paid: true,
        paidAmount: 300,
        paymentClaimed: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Confirmed payments for ${result.count} attendees.`,
      updatedCount: result.count,
    })
  } catch (error: any) {
    console.error("Error confirming all payments:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to confirm payments" },
      { status: 500 }
    )
  }
}
