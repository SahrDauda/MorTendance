import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const runtime = "nodejs"

export async function GET() {
  try {
    // Simple DB liveness check
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, db: "up" })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json({ ok: false, db: "down" }, { status: 500 })
  }
}

