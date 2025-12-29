import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        async jwt({ token, user }) {
            try {
                console.log("[Auth] JWT callback - user:", user ? "present" : "null", "token:", token)
                if (user) {
                    token.id = user.id
                    token.role = user.role
                    token.email = user.email || undefined
                    token.name = user.name || undefined
                }
                return token
            } catch (error) {
                console.error("[Auth] JWT callback error:", error)
                return token
            }
        },
        async session({ session, token }) {
            try {
                console.log("[Auth] Session callback - token:", JSON.stringify(token), "session:", JSON.stringify(session))
                if (!session.user) {
                    console.error("[Auth] Session callback - session.user is missing!")
                    throw new Error("Session user is missing")
                }

                if (token) {
                    session.user.id = (token.id as string) || (token.sub as string) || ""
                    session.user.role = (token.role as string) || "LEADER"
                    session.user.email = (token.email as string) || session.user.email || ""
                    session.user.name = (token.name as string) || session.user.name || ""
                } else {
                    console.error("[Auth] Session callback - token is missing!")
                }

                console.log("[Auth] Session callback - final session:", JSON.stringify(session))
                return session
            } catch (error) {
                console.error("[Auth] Session callback error:", error)
                console.error("[Auth] Session callback error stack:", error instanceof Error ? error.stack : "No stack")
                throw error // Re-throw to see the actual error
            }
        },
        async authorized({ auth, request: { nextUrl } }) {
            console.log("[Auth] Authorized callback - auth:", auth ? "authenticated" : "not authenticated")
            return true
        },
    },
    providers: [], // Configured in lib/auth.ts
    trustHost: true, // Required for NextAuth v5
} satisfies NextAuthConfig
