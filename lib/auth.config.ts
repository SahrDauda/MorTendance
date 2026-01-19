import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/auth/signin",
    },
    // debug: process.env.NODE_ENV === "development",
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const { pathname } = nextUrl

            // 1. Public Routes (Always allow)
            const isPublicRoute =
                pathname.startsWith('/auth') ||
                pathname.startsWith('/api/auth') ||
                pathname.startsWith('/check-in') || // Allow public check-in
                pathname === '/'

            if (isPublicRoute) {
                if (isLoggedIn && pathname.startsWith('/auth')) {
                    const dashboardUrl = nextUrl.clone()
                    dashboardUrl.pathname = '/dashboard'
                    return Response.redirect(dashboardUrl)
                }
                return true
            }

            // 2. Protected Routes
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
    providers: [],
    // session: { strategy: "jwt" },
    // secret: process.env.AUTH_SECRET,
    trustHost: true,
} satisfies NextAuthConfig
