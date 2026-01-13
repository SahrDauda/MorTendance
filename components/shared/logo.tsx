"use client"

import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "icon" | "full"
  href?: string
}

export function Logo({ className, size = "md", variant = "full", href = "/" }: LogoProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const imageSizes = {
    sm: { width: 30, height: 10 },
    md: { width: 45, height: 16 },
    lg: { width: 60, height: 21 },
  }

  const iconSizes = {
    sm: { width: 16, height: 16 },
    md: { width: 24, height: 24 },
    lg: { width: 32, height: 32 },
  }

  const dimensions = variant === "icon" ? iconSizes[size] : imageSizes[size]

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex items-center justify-center rounded-xl bg-slate-900 p-1.5 shadow-xl border border-white/10 overflow-hidden group transition-all hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
        <Image
          src="/mor_logo.png"
          alt="MOR Logo"
          width={dimensions.width}
          height={dimensions.height}
          className="relative z-10 object-contain"
          priority
        />
      </div>
      {variant === "full" && (
        <div className="flex flex-col -space-y-1">
          <span className="font-black text-xl tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            MOR
          </span>
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            Admin Dashboard
          </span>
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
