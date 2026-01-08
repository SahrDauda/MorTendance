import type { NextAuthConfig } from "next-auth"

// Helper to get and trim environment variables
const getEnv = (key: string) => process.env[key]?.trim() || ""

export const authConfig = {
    pages: {
        signIn: "/auth/signin",
    },
    debug: process.env.NODE_ENV === "development",
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const { pathname } = nextUrl

            // 1. Allow API routes and Public assets
            if (pathname.startsWith('/api') || pathname.startsWith('/public')) {
                return true
            }

            // 2. Handle Auth Pages (Signin/Signup)
            const isAuthPage = pathname.startsWith('/auth')
            if (isAuthPage) {
                if (isLoggedIn) {
                    return Response.redirect(new URL('/dashboard', nextUrl))
                }
                return true
            }

            // 3. Protect everything else
            return isLoggedIn
        },
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
    providers: [], // Configured in lib/auth.ts
    session: {
        strategy: "jwt",
    },
    // Trim secrets to prevent "Invalid URL" or "Configuration" errors caused by trailing spaces
    secret: getEnv("AUTH_SECRET") || getEnv("NEXTAUTH_SECRET") || "fallback-secret-for-dev-only",
    trustHost: true,
} satisfies NextAuthConfig
