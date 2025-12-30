import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
})

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const secretPresent = !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET)
  console.log(`[Middleware] Processing: ${pathname}, Secret present: ${secretPresent}, Auth: ${req.auth ? "Authenticated" : "Not Authenticated"}`)

  const isAuthPage = pathname.startsWith("/auth")
  const isApiRoute = pathname.startsWith("/api")
  const isPublicRoute = pathname.startsWith("/public")
  const isRoot = pathname === "/"

  // Allow public routes and API routes
  if (isPublicRoute || isApiRoute) {
    return NextResponse.next()
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && req.auth) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Redirect unauthenticated users from root and dashboard routes to signin
  if ((isRoot || !isAuthPage) && !req.auth) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
