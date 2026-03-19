import { SignJWT, jwtVerify } from "jose"

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "mobile-fallback-secret-32-chars!!"
)

const ALGORITHM = "HS256"
const EXPIRY = "30d"

export interface MobileTokenPayload {
  sub: string
  email: string
  name: string
  role: string
  iat?: number
  exp?: number
}

export async function signMobileToken(
  payload: Omit<MobileTokenPayload, "iat" | "exp">
): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secret)
}

export async function verifyMobileToken(
  token: string
): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as MobileTokenPayload
  } catch {
    return null
  }
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null
  return authHeader.substring(7)
}
