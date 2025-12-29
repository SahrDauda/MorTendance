/**
 * Rate Limiter for AI API endpoints
 * Tracks requests per user/IP to prevent abuse
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

/**
 * Check if request is within rate limit
 * @param identifier - User ID or IP address
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const key = `${identifier}:${limit}:${windowMs}`

  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt < now) {
    // Create new entry
    const resetAt = now + windowMs
    rateLimitStore.set(key, {
      count: 1,
      resetAt,
    })
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt,
    }
  }

  // Entry exists and is still valid
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Get rate limit info without incrementing
 */
export function getRateLimitInfo(
  identifier: string,
  limit: number,
  windowMs: number = 60000
): { remaining: number; resetAt: number } {
  const now = Date.now()
  const key = `${identifier}:${limit}:${windowMs}`
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt < now) {
    return {
      remaining: limit,
      resetAt: now + windowMs,
    }
  }

  return {
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  }
}

/**
 * Clear rate limit for an identifier (useful for testing)
 */
export function clearRateLimit(identifier: string) {
  for (const key of rateLimitStore.keys()) {
    if (key.startsWith(`${identifier}:`)) {
      rateLimitStore.delete(key)
    }
  }
}




