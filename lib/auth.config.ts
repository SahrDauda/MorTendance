import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        async authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = !nextUrl.pathname.startsWith('/auth')

            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect to login
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/', nextUrl))
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
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    trustHost: true,
} satisfies NextAuthConfig
