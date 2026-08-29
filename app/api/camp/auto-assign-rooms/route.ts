import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { success: false, error: "Auto-assignment has been permanently disabled." },
    { status: 403 }
  )
}
