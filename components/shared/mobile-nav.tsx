"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Sparkles, QrCode, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"

const mobileNavigation = [
  { name: "Command", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: "Check-in", href: ROUTES.CAMP_ATTENDANCE, icon: QrCode },
  { name: "Delegates", href: ROUTES.CAMP_MEMBERS, icon: Users },
  { name: "Groups", href: ROUTES.CAMP_GROUPS, icon: Sparkles },
  { name: "Tags", href: ROUTES.CAMP_TAGS, icon: Tag },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur-lg lg:hidden pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] select-none">
      <div className="flex items-center justify-around h-16 px-1">
        {mobileNavigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== ROUTES.DASHBOARD && pathname.startsWith(item.href))
          const IconComponent = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 h-full py-1 text-[10px] font-bold transition-all active:scale-90",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground/80 hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-primary rounded-full" />
              )}
              <div
                className={cn(
                  "p-1 rounded-xl transition-all",
                  isActive && "bg-primary/10"
                )}
              >
                <IconComponent className={cn("h-5 w-5", isActive && "text-primary")} />
              </div>
              <span className="leading-none tracking-tight">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
