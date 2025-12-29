import { NextRequest, NextResponse } from "next/server"

// Simple in-memory sliding window per instance. Good enough for basic abuse protection.
const buckets = new Map<string, number[]>()

export async function rateLimit(
  request: NextRequest,
  key: string,
  limit = 20,
  windowMs = 60_000
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.ip ||
    "unknown"

  const bucketKey = `${key}:${ip}`
  const now = Date.now()
  const windowStart = now - windowMs

  const timestamps = buckets.get(bucketKey)?.filter((ts) => ts > windowStart) || []
  timestamps.push(now)
  buckets.set(bucketKey, timestamps)

  if (timestamps.length > limit) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": `${Math.ceil(windowMs / 1000)}` } }
      ),
    }
  }

  return { ok: true }
}

