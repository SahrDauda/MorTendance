import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
          throw new Error("MISSING_CREDENTIALS")
        }

        try {
          // Dynamic imports to keep this file Edge-compatible
          const { db } = await import("./db")
          const bcrypt = await import("bcryptjs")

          const user = await db.user.findUnique({
            where: { email },
          })

          if (!user) {
            throw new Error("ACCOUNT_NOT_FOUND")
          }

          const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
          if (!isPasswordValid) {
            throw new Error("INVALID_PASSWORD")
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error: any) {
          if (["ACCOUNT_NOT_FOUND", "INVALID_PASSWORD"].includes(error.message)) {
            throw error
          }
          console.error("[Auth] Database error:", error)
          throw new Error("DATABASE_ERROR")
        }
      },
    }),
  ],
})



