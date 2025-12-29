"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  BarChart3,
  Settings,
  UserCircle,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSession } from "@/lib/hooks/use-session"

const baseNavigation = [
  { name: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: "Attendance", href: ROUTES.ATTENDANCE, icon: ClipboardCheck },
  { name: "Members", href: ROUTES.MEMBERS, icon: Users },
  { name: "Reports", href: ROUTES.REPORTS, icon: BarChart3 },
]

const adminNavigation = [
  { name: "Leaders", href: "/admin/leaders", icon: ShieldCheck },
]

export function Sidebar() {
  const pathname = usePathname()
  const { session } = useSession()

  const navigation = session?.user?.role === "ADMIN"
    ? [...baseNavigation, ...adminNavigation]
    : baseNavigation

  return (
    <aside className="hidden border-r border-border bg-gradient-to-b from-card to-card/95 backdrop-blur-sm lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:pt-16">
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const IconComponent = item.icon
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 transition-all group",
                    isActive
                      ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-semibold shadow-sm border-l-4 border-primary"
                      : "hover:bg-primary/5 hover:text-primary"
                  )}
                >
                  <IconComponent
                    className={cn(
                      "h-5 w-5 transition-all",
                      isActive
                        ? "fill-primary/20 text-primary"
                        : "group-hover:scale-110 text-muted-foreground group-hover:text-primary"
                    )}
                  />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-border p-3 bg-muted/30">
        <Link href={ROUTES.SETTINGS}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3",
              pathname === ROUTES.SETTINGS && "bg-primary/10 text-primary font-semibold"
            )}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Button>
        </Link>
      </div>
    </aside>
  )
}
