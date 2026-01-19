import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

export default NextAuth(authConfig).auth

export const config = {
  // Protects specific routes
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/members/:path*",
    "/attendance/:path*",
    "/reports/:path*",
    "/auth/:path*",
    "/cbs/:path*"
  ],
}
