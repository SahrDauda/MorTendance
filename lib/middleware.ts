import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export class AuthError extends Error {
  status: number
  constructor(message: string = "Unauthorized", status: number = 401) {
    super(message)
    this.name = "AuthError"
    this.status = status
  }
}

export async function requireAuth(request: NextRequest) {
  try {
    // In NextAuth v5, auth() can be called without parameters in API routes
    // It automatically uses the request context from the current execution
    const session = await auth()

    if (!session?.user) {
      console.error("requireAuth - No session or user found")
      throw new AuthError("Unauthorized")
    }

    console.log("requireAuth - Session found:", {
      userId: session.user?.id,
      email: session.user?.email,
    })

    return session
  } catch (error: any) {
    console.error("requireAuth - Error:", error)
    throw error instanceof AuthError ? error : new AuthError("Unauthorized")
  }
}

export function getUserId(session: any): string {
  if (!session?.user?.id) {
    throw new AuthError("User ID not found in session")
  }
  return session.user.id
}

/**
 * Require user to have INSTITUTION role
 */
export async function requireIssuerRole(request: NextRequest) {
  const session = await requireAuth(request)

  if (session.user.role !== "INSTITUTION") {
    throw new AuthError("Only institutions can issue credentials", 403)
  }

  return session
}
