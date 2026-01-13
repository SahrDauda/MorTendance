"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Search, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { Logo } from "./logo"
import { ROUTES } from "@/lib/constants"
import { useSession } from "@/lib/hooks/use-session"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

export function Header() {
  const router = useRouter()
  const { user } = useSession()

  const handleSignOut = async () => {
    try {
      // Use signOut from next-auth/react which works with NextAuth v5
      const result = await signOut({
        redirect: false,
        callbackUrl: "/auth/signin"
      })

      // Force navigation to signin page
      window.location.href = "/auth/signin"
    } catch (error) {
      console.error("Sign out error:", error)
      // Fallback: force redirect to signin
      window.location.href = "/auth/signin"
    }
  }

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/95 backdrop-blur-md shadow-sm">
      <div className="w-full max-w-7xl mx-auto flex h-16 items-center gap-4 px-4">
        <Logo variant="icon" size="sm" />

        <div className="flex flex-1 items-center gap-4 md:gap-8">
          <div className="hidden flex-1 md:block md:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search members, groups, reports..."
                className="pl-9 border-border/50 focus:border-primary/50 focus:ring-primary/20"
              />
            </div>
          </div>

          <nav className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 hover:text-primary">
              <Bell className="h-6 w-6" />
              <span className="sr-only">Notifications</span>
            </Button>

            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:ring-2 hover:ring-primary/20 transition-all">
                    <Avatar className="h-9 w-9 ring-2 ring-border hover:ring-primary/40 transition-all">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || "user@example.com"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.SETTINGS}>Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
