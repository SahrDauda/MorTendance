import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[Auth] authorize called with email:", credentials?.email)
        const email = credentials?.email?.toString().trim().toLowerCase() || ""
        const password = credentials?.password?.toString() || ""

        if (!email || !password) {
          console.error("[Auth] Missing credentials - email:", !!email, "password:", !!password)
          return null
        }

        try {
          console.log("[Auth] Attempting to authenticate:", email)
          // Dynamic imports to keep this file Edge-compatible
          const { db } = await import("./db")
          const bcrypt = await import("bcryptjs")

          const user = await db.user.findUnique({
            where: { email },
          })

          if (!user) {
            console.error("[Auth] Account not found:", email)
            return null
          }

          console.log("[Auth] User found:", user.email, "Role:", user.role)
          const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

          if (!isPasswordValid) {
            console.error("[Auth] Invalid password for:", email)
            return null
          }

          console.log("[Auth] Password valid, returning user object")
          const userObject = {
            id: String(user.id),
            email: String(user.email),
            name: String(user.name || ""),
            role: String(user.role),
          }
          console.log("[Auth] Returning user:", userObject)
          return userObject
        } catch (error: any) {
          console.error("[Auth] Database error:", error)
          console.error("[Auth] Error stack:", error?.stack)
          return null
        }
      },
    }),
  ],
})



