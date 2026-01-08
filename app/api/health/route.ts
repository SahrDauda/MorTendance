import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log("[Health Check] Mocking DB as up")
    return NextResponse.json({ ok: true, db: "up (mocked)" })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json({ ok: false, db: "down", error: String(error) }, { status: 500 })
  }
}
