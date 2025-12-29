import type React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

export function PageHeader({ title, description, action, className, icon }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between", className)}>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 ring-2 ring-primary/20">
              {icon}
            </div>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-balance bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {title}
          </h1>
        </div>
        {description && <p className="text-muted-foreground text-pretty pl-0 md:pl-0">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

