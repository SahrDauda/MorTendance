"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { PwaInstallButton } from "./pwa-install-button"

export function Header() {
  const router = useRouter()
  const { user } = useSession()

  const handleSignOut = async () => {
    try {
      await signOut({
        redirect: false,
        callbackUrl: "/auth/signin",
      })
      window.location.href = "/auth/signin"
    } catch (error) {
      console.error("Sign out error:", error)
      window.location.href = "/auth/signin"
    }
  }

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-lg shadow-sm pt-[env(safe-area-inset-top)]">
      <div className="w-full max-w-7xl mx-auto flex h-16 items-center justify-between gap-3 px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Logo variant="icon" size="sm" />
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black tracking-tight text-foreground leading-none">
              MOR Camp
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-none mt-0.5">
              Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          <PwaInstallButton />

          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:ring-2 hover:ring-primary/20 transition-all h-9 w-9"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-border hover:ring-primary/40 transition-all">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-xl">
                <DropdownMenuLabel className="font-normal p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-bold leading-none">{user?.name || "Leader / Admin"}</p>
                    <p className="text-[11px] leading-none text-muted-foreground">
                      {user?.email || "leader@mor.org"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-xl text-xs font-semibold py-2">
                  <Link href={ROUTES.CAMP_ATTENDANCE}>Check-in Portal</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl text-xs font-semibold py-2">
                  <Link href={ROUTES.CAMP_MEMBERS}>Camp Attendees</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl text-xs font-semibold py-2">
                  <Link href={ROUTES.CAMP_GROUPS}>Fellowship Groups</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl text-xs font-semibold py-2">
                  <Link href={ROUTES.CAMP_ANALYSIS}>Group Analysis & Radar</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="rounded-xl text-xs font-bold py-2 text-red-600 focus:text-red-600 cursor-pointer"
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted/60" />
          )}
        </div>
      </div>
    </header>
  )
}
