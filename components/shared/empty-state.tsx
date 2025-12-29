"use client"

import type { LucideIcon } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  image?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, image, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {image ? (
        <div className="mb-6 relative w-48 h-48 opacity-60">
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain"
            priority={false}
          />
        </div>
      ) : Icon ? (
        <div className="mb-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-6 ring-2 ring-primary/20">
          <Icon className="h-10 w-10 text-primary" />
        </div>
      ) : (
        <div className="mb-4 rounded-full bg-muted p-6">
          <div className="h-10 w-10 rounded-full bg-muted-foreground/20" />
        </div>
      )}
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button onClick={action.onClick} size="lg" className="gap-2">
          {action.label}
        </Button>
      )}
    </div>
  )
}
