"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, BedDouble, Sparkles, QrCode, Printer } from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"

const mobileNavigation = [
  { name: "Command", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: "Attendees", href: ROUTES.CAMP_MEMBERS, icon: Users },
  // { name: "Rooms", href: ROUTES.CAMP_ROOMS, icon: BedDouble },
  { name: "Groups", href: ROUTES.CAMP_GROUPS, icon: Sparkles },
  { name: "Check-in", href: ROUTES.CAMP_ATTENDANCE, icon: QrCode },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-card/95 backdrop-blur-md lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {mobileNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href)
          const IconComponent = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 h-full text-[10px] transition-colors active:scale-95",
                isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <IconComponent className={cn("h-5 w-5", isActive && "fill-primary/20 text-primary")} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
