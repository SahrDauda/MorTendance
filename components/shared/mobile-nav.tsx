"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, Sparkles, ClipboardCheck, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"

export function MobileNav() {
  const pathname = usePathname()

  const isCheckInActive =
    pathname === ROUTES.CAMP_ATTENDANCE ||
    pathname.startsWith(ROUTES.CAMP_ATTENDANCE)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur-xl lg:hidden pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(0,0,0,0.12)] select-none">
      <div className="relative flex items-center justify-around h-16 px-2 sm:px-4">
        {/* Left Item 1: Home */}
        <Link
          href={ROUTES.DASHBOARD}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 h-full py-1 text-[10px] font-bold transition-all active:scale-90",
            pathname === ROUTES.DASHBOARD
              ? "text-primary"
              : "text-muted-foreground/80 hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "p-1.5 rounded-xl transition-all",
              pathname === ROUTES.DASHBOARD && "bg-primary/10"
            )}
          >
            <Home className="h-5 w-5" />
          </div>
          <span className="leading-none">Home</span>
        </Link>

        {/* Left Item 2: Members */}
        <Link
          href={ROUTES.CAMP_MEMBERS}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 h-full py-1 text-[10px] font-bold transition-all active:scale-90 mr-4",
            pathname === ROUTES.CAMP_MEMBERS || pathname.startsWith(ROUTES.CAMP_MEMBERS)
              ? "text-primary"
              : "text-muted-foreground/80 hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "p-1.5 rounded-xl transition-all",
              (pathname === ROUTES.CAMP_MEMBERS || pathname.startsWith(ROUTES.CAMP_MEMBERS)) &&
                "bg-primary/10"
            )}
          >
            <Users className="h-5 w-5" />
          </div>
          <span className="leading-none">Members</span>
        </Link>

        {/* Center Floating Button: Check In */}
        <div className="absolute left-1/2 -top-5 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
          <Link
            href={ROUTES.CAMP_ATTENDANCE}
            className={cn(
              "w-13 h-13 rounded-full flex flex-col items-center justify-center text-white shadow-xl ring-4 ring-background transition-all duration-300 active:scale-90",
              isCheckInActive
                ? "bg-gradient-to-tr from-teal-600 via-primary to-emerald-400 shadow-primary/40 scale-105"
                : "bg-gradient-to-tr from-slate-900 via-slate-800 to-primary shadow-slate-900/40 hover:scale-105"
            )}
          >
            <ClipboardCheck className="w-6 h-6 animate-pulse" />
          </Link>
          <span
            className={cn(
              "text-[9px] font-black tracking-tight mt-0.5 uppercase",
              isCheckInActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            Check In
          </span>
        </div>

        {/* Right Item 1: Groups */}
        <Link
          href={ROUTES.CAMP_GROUPS}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 h-full py-1 text-[10px] font-bold transition-all active:scale-90 ml-4",
            pathname === ROUTES.CAMP_GROUPS || pathname.startsWith(ROUTES.CAMP_GROUPS)
              ? "text-primary"
              : "text-muted-foreground/80 hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "p-1.5 rounded-xl transition-all",
              (pathname === ROUTES.CAMP_GROUPS || pathname.startsWith(ROUTES.CAMP_GROUPS)) &&
                "bg-primary/10"
            )}
          >
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="leading-none">Groups</span>
        </Link>

        {/* Right Item 2: Analysis */}
        <Link
          href={ROUTES.CAMP_ANALYSIS}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 h-full py-1 text-[10px] font-bold transition-all active:scale-90",
            pathname === ROUTES.CAMP_ANALYSIS || pathname.startsWith(ROUTES.CAMP_ANALYSIS)
              ? "text-primary"
              : "text-muted-foreground/80 hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "p-1.5 rounded-xl transition-all",
              (pathname === ROUTES.CAMP_ANALYSIS || pathname.startsWith(ROUTES.CAMP_ANALYSIS)) &&
                "bg-primary/10"
            )}
          >
            <BarChart3 className="h-5 w-5" />
          </div>
          <span className="leading-none">Analysis</span>
        </Link>
      </div>
    </nav>
  )
}
