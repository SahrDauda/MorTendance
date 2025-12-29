import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "./db"
import bcrypt from "bcryptjs"

/**
 * MVP-Ready: Validates and prepares the authentication secret.
 * Throws an error if secret is missing to prevent app from starting with broken auth.
 */
function getAuthSecret(): string {
  const rawSecret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET)?.trim()

  if (!rawSecret) {
    const errorMessage =
      "\n" +
      "╔══════════════════════════════════════════════════════════════╗\n" +
      "║  AUTHENTICATION CONFIGURATION ERROR                          ║\n" +
      "╚══════════════════════════════════════════════════════════════╝\n" +
      "\n" +
      "Missing AUTH_SECRET or NEXTAUTH_SECRET environment variable.\n" +
      "\n" +
      "To fix this:\n" +
      "1. Open your .env file in the project root\n" +
      "2. Add one of these lines:\n" +
      "   AUTH_SECRET=your-secret-here\n" +
      "   OR\n" +
      "   NEXTAUTH_SECRET=your-secret-here\n" +
      "\n" +
      "3. Generate a secure secret by running:\n" +
      "   openssl rand -base64 32\n" +
      "\n" +
      "4. Restart your development server after adding the secret.\n" +
      "\n"

    console.error(errorMessage)
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET environment variable is required")
  }

  // Remove quotes if present (common in .env files)
  const cleanSecret = rawSecret.replace(/^["']|["']$/g, '')

  if (cleanSecret !== rawSecret) {
    console.warn("[Auth] Secret had quotes, they have been removed")
  }

  if (!cleanSecret || cleanSecret.length === 0) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET cannot be empty")
  }

  if (cleanSecret.length < 16) {
    console.warn("[Auth] WARNING: Secret is shorter than recommended (16+ characters recommended)")
  }

  console.log("[Auth] Secret configured: ✓ (length: " + cleanSecret.length + ")")
  return cleanSecret
}

// Validate secret at module load time - prevents app from starting with broken auth
const authSecret = getAuthSecret()

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[Auth] Authorize called with credentials:", { email: credentials?.email ? "***" : "missing" })

        // Normalize inputs
        const email = credentials?.email?.toString().trim().toLowerCase() || ""
        const password = credentials?.password?.toString() || ""

        // Basic presence checks with explicit error codes
        if (!email && !password) {
          console.log("[Auth] Missing both email and password")
          throw new Error("MISSING_EMAIL_AND_PASSWORD")
        }
        if (!email) {
          console.log("[Auth] Missing email")
          throw new Error("MISSING_EMAIL")
        }
        if (!password) {
          console.log("[Auth] Missing password")
          throw new Error("MISSING_PASSWORD")
        }

        try {
          console.log("[Auth] Looking up user in database:", email)
          const user = await db.user.findUnique({
            where: { email },
          })

          if (!user) {
            console.log("[Auth] User not found:", email)
            throw new Error("ACCOUNT_NOT_FOUND")
          }

          console.log("[Auth] User found, verifying password")
          const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
          if (!isPasswordValid) {
            console.log("[Auth] Invalid password for user:", email)
            throw new Error("INVALID_PASSWORD")
          }

          console.log("[Auth] Authentication successful for user:", email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error: any) {
          // If it's already one of our custom errors, re-throw it
          if (
            error?.message === "ACCOUNT_NOT_FOUND" ||
            error?.message === "INVALID_PASSWORD" ||
            error?.message === "MISSING_EMAIL" ||
            error?.message === "MISSING_PASSWORD" ||
            error?.message === "MISSING_EMAIL_AND_PASSWORD"
          ) {
            throw error
          }
          // For database errors, log and throw a generic error
          console.error("[Auth] Database error during authentication:", error)
          throw new Error("DATABASE_ERROR")
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: authSecret,
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
  // Add explicit error handling
  events: {
    async signIn({ user, account, profile }) {
      console.log("[Auth] SignIn event:", { userId: user?.id, email: user?.email })
    },
    async signOut() {
      console.log("[Auth] SignOut event")
    },
  },
})

