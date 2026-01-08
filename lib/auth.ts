import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { MOCK_USERS } from "./mock-data"

/**
 * Validates and prepares the authentication secret.
 */
function getAuthSecret(): string {
  const rawSecret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET)?.trim()

  if (!rawSecret) {
    console.warn("[Auth] Missing AUTH_SECRET or NEXTAUTH_SECRET environment variable.")
    return "development-secret-only-do-not-use-in-production"
  }

  return rawSecret.replace(/^["']|["']$/g, '')
}

const authSecret = getAuthSecret()

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase() || ""
        const password = credentials?.password?.toString() || ""

        if (!email || !password) {
          return null
        }

        console.log("[Auth] Attempting login with mock data for:", email)

        // Find user in mock data
        const user = MOCK_USERS.find(u => u.email === email)

        if (!user) {
          console.log("[Auth] User not found in mock data")
          return null
        }

        // For mock data, we check plain text password or hashed if we want to be fancy
        // But since the user asked to skip Prisma/errors, let's keep it simple.
        // If the mock password matches or if we hash it here for consistency:
        if (password === user.password) {
          console.log("[Auth] Login successful for:", email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        }

        console.log("[Auth] Invalid password")
        return null
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
})
