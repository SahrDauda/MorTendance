import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = (token.id as string) || (token.sub as string)
                session.user.role = (token.role as string) || "STUDENT"
            }
            return session
        },
    },
    providers: [], // Configured in lib/auth.ts
} satisfies NextAuthConfig
