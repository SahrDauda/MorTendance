"use client"

import { cn } from "@/lib/utils"

interface CircularProgressProps {
  value: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  className?: string
}

export function CircularProgress({ value, size = "md", showValue = true, className }: CircularProgressProps) {
  const sizes = {
    sm: { circle: 60, stroke: 4, fontSize: "text-xs" },
    md: { circle: 80, stroke: 5, fontSize: "text-sm" },
    lg: { circle: 100, stroke: 6, fontSize: "text-base" },
  }

  const { circle, stroke, fontSize } = sizes[size]
  const radius = (circle - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  const getStrokeColor = () => {
    if (value >= 80) return "#0D9488" // teal-600
    if (value >= 60) return "#84CC16" // lime-500
    if (value >= 40) return "#F59E0B" // amber-500
    return "#EF4444" // red-500
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={circle} height={circle} className="-rotate-90 transform">
        {/* Background circle */}
        <circle
          cx={circle / 2}
          cy={circle / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={stroke}
          fill="none"
          opacity="0.3"
        />
        {/* Progress circle */}
        <circle
          cx={circle / 2}
          cy={circle / 2}
          r={radius}
          stroke={getStrokeColor()}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", fontSize)} style={{ color: getStrokeColor() }}>
            {value}%
          </span>
        </div>
      )}
    </div>
  )
}
