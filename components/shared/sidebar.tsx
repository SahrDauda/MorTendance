"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  BedDouble,
  QrCode,
  Printer,
  Sparkles,
  UserCircle,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const campNavigation = [
  { name: "Command Center", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: "Camp Attendees", href: ROUTES.CAMP_MEMBERS, icon: Users },
  { name: "Camp Groups", href: ROUTES.CAMP_GROUPS, icon: Sparkles },
  { name: "Check-in Desk", href: ROUTES.CAMP_ATTENDANCE, icon: QrCode },
  { name: "Group Analysis", href: ROUTES.CAMP_ANALYSIS, icon: Printer },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden border-r border-border bg-gradient-to-b from-card to-card/95 backdrop-blur-sm lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:pt-16">
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-4">
          {/* MOR Camp 2026 Section */}
          <div className="space-y-1">
            <div className="px-3 py-1 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                MOR Camp 2026
              </span>
              <span className="text-[9px] bg-primary/15 text-primary font-bold px-1.5 py-0.5 rounded">
                LIVE
              </span>
            </div>
            <nav className="flex flex-col gap-1.5 pt-1">
              {campNavigation.map((item) => {
                const isActive =
                  item.href === ROUTES.DASHBOARD
                    ? pathname === ROUTES.DASHBOARD || pathname === "/"
                    : pathname === item.href || pathname.startsWith(item.href)
                const IconComponent = item.icon
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 transition-all group h-10 text-xs font-semibold",
                        isActive
                          ? "bg-primary/15 text-primary shadow-sm border-l-4 border-primary"
                          : "hover:bg-primary/5 hover:text-primary text-muted-foreground"
                      )}
                    >
                      <IconComponent
                        className={cn(
                          "h-4 w-4 transition-all",
                          isActive
                            ? "text-primary"
                            : "group-hover:scale-110 text-muted-foreground group-hover:text-primary"
                        )}
                      />
                      {item.name}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t border-border p-3 bg-muted/30 space-y-1">
        <Link href={ROUTES.PROFILE}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-9 text-xs",
              pathname === ROUTES.PROFILE && "bg-primary/10 text-primary font-semibold"
            )}
          >
            <UserCircle className="h-4 w-4" />
            My Profile
          </Button>
        </Link>
        <Link href={ROUTES.SETTINGS}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-9 text-xs",
              pathname === ROUTES.SETTINGS && "bg-primary/10 text-primary font-semibold"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>
    </aside>
  )
}
