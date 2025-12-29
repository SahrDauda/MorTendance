"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ClipboardCheck, Users, BarChart3, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"

const mobileNavigation = [
  { name: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: "Attendance", href: ROUTES.ATTENDANCE, icon: ClipboardCheck },
  { name: "Members", href: ROUTES.MEMBERS, icon: Users },
  { name: "Reports", href: ROUTES.REPORTS, icon: BarChart3 },
  { name: "Settings", href: ROUTES.SETTINGS, icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-around">
        {mobileNavigation.map((item) => {
          const isActive = pathname === item.href
          const IconComponent = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-[10px] transition-colors",
                isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <IconComponent className={cn("h-5 w-5", isActive && "fill-primary/20")} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
