import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Simple query to check DB connection
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, db: "up" })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json({ ok: false, db: "down", error: String(error) }, { status: 500 })
  }
}
