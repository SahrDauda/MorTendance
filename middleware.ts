import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth(async (req) => {
  const { pathname } = req.nextUrl
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
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Block signup page - only login allowed
  if (pathname === "/auth/signup") {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  // Allow root page to be accessible (it will show landing page for unauthenticated users)
  // Redirect unauthenticated users from dashboard routes to signin
  if (!isRoot && !isAuthPage && !req.auth) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
