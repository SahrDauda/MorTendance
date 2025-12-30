import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"

// Mock users for development/testing
const MOCK_USERS = [
  {
    id: "mock-admin-id",
    email: "admin@example.com",
    name: "Admin User",
    password: "password", // In real app, this would be hashed
    role: "ADMIN",
  },
  {
    id: "mock-leader-id",
    email: "leader@example.com",
    name: "Leader User",
    password: "password",
    role: "LEADER",
  },
]

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "mock-secret-for-dev",
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[Auth] Authorize called with mock data")
        const email = credentials?.email?.toString().trim().toLowerCase() || ""
        const password = credentials?.password?.toString() || ""

        if (!email || !password) {
          console.error("[Auth] Missing credentials")
          return null
        }

        // Find mock user
        const user = MOCK_USERS.find((u) => u.email === email)

        if (!user) {
          console.error("[Auth] Mock user not found:", email)
          return null
        }

        // Simple password check for mock data
        if (user.password !== password) {
          console.error("[Auth] Invalid password for mock user:", email)
          return null
        }

        console.log("[Auth] Mock authentication successful for:", email)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
})
