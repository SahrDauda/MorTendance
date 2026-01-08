import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/attendance') ||
                nextUrl.pathname.startsWith('/members') ||
                nextUrl.pathname.startsWith('/reports') ||
                nextUrl.pathname.startsWith('/admin') ||
                nextUrl.pathname === '/';

            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            } else if (isLoggedIn && nextUrl.pathname.startsWith('/auth')) {
                return Response.redirect(new URL('/dashboard', nextUrl))
            }
            return true
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
    // IMPORTANT: On Vercel, ensure AUTH_SECRET is set in the dashboard.
    // We use a fallback only for local development to prevent crashes.
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only",
    trustHost: true,
} satisfies NextAuthConfig
