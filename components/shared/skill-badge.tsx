import { Badge } from "@/components/ui/badge"
import { Check, Code, Palette, Globe, Wrench, MessageSquare, Award } from "lucide-react"
import { cn } from "@/lib/utils"

interface SkillBadgeProps {
  name: string
  verified?: boolean
  category?: "TECHNICAL" | "SOFT_SKILL" | "DOMAIN_KNOWLEDGE" | "TOOLS" | "LANGUAGES"
  variant?: "default" | "secondary" | "outline"
  size?: "sm" | "md" | "lg"
  className?: string
}

const categoryIcons = {
  TECHNICAL: Code,
  SOFT_SKILL: MessageSquare,
  DOMAIN_KNOWLEDGE: Award,
  TOOLS: Wrench,
  LANGUAGES: Globe,
}

export function SkillBadge({ name, verified = false, category, variant = "default", size = "md", className }: SkillBadgeProps) {
  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  }

  const CategoryIcon = category ? categoryIcons[category] : null

  return (
    <Badge variant={variant} className={cn("gap-1.5 items-center", sizes[size], className)}>
      {CategoryIcon && <CategoryIcon className="h-3 w-3" />}
      {name}
      {verified && <Check className="h-3 w-3 text-success" />}
    </Badge>
  )
}
