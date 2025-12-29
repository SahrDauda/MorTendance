import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("border-2 hover:border-primary/30 transition-all hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {value}
            </p>
            {trend && (
              <div className={cn("flex items-center gap-1 text-xs font-semibold", trend.isPositive ? "text-success" : "text-destructive")}>
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-3 ring-2 ring-primary/20">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
