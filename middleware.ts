import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

export default NextAuth(authConfig).auth

export const config = {
  // Protects all routes except static files, images, and API routes
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
