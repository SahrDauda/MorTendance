import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrendIndicatorProps {
  value: number
  showIcon?: boolean
  showValue?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function TrendIndicator({
  value,
  showIcon = true,
  showValue = true,
  size = "md",
  className,
}: TrendIndicatorProps) {
  const isPositive = value > 0
  const isNeutral = value === 0

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        isPositive && "text-success",
        !isPositive && !isNeutral && "text-destructive",
        isNeutral && "text-muted-foreground",
        textSizes[size],
        className,
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {showValue && <span>{Math.abs(value)}%</span>}
    </div>
  )
}
