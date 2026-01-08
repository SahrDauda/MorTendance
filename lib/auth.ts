import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { MOCK_USERS } from "./mock-data"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = credentials?.email?.toString().trim().toLowerCase() || ""
          const password = credentials?.password?.toString() || ""

          if (!email || !password) {
            return null
          }

          console.log("[Auth] Attempting login for:", email)

          const user = MOCK_USERS.find(u => u.email === email)

          if (user && password === user.password) {
            console.log("[Auth] Login successful")
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            }
          }

          console.log("[Auth] Invalid credentials")
          return null
        } catch (error) {
          console.error("[Auth] Authorize error:", error)
          return null
        }
      },
    }),
  ],
})
