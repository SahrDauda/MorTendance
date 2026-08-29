import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsedCredentials = z
            .object({ email: z.string().email(), password: z.string().min(6) })
            .safeParse(credentials)

          if (parsedCredentials.success) {
            const email = parsedCredentials.data.email.toLowerCase().trim()
            const { password } = parsedCredentials.data

            console.log("Attempting login for:", email)
            const user = await db.user.findFirst({
              where: {
                email: {
                  equals: email,
                  mode: "insensitive",
                },
              },
            })
            if (!user) {
              console.log("User not found:", email)
              return null
            }

            const passwordsMatch = await bcrypt.compare(password, user.passwordHash)
            if (passwordsMatch) {
              console.log("Login successful for:", email)
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              }
            }
            console.log("Invalid password for:", email)
          } else {
            console.log("Invalid credentials format")
          }

          return null
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  debug: true, // Temporary: set to true to see detailed errors in Vercel logs
})
