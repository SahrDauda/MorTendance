import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, db: "down", error: "DATABASE_URL not configured" }, { status: 500 })
    }

    // Simple DB liveness check
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, db: "up" })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json({ ok: false, db: "down", error: String(error) }, { status: 500 })
  }
}

