/**
 * Match Explanation Component
 * Displays AI-generated explanation for why an opportunity matches a user
 */

"use client"

import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface MatchExplanationProps {
    opportunityId: string
    className?: string
    variant?: "card" | "inline" | "badge"
}

export function MatchExplanation({ opportunityId, className, variant = "card" }: MatchExplanationProps) {
    const [explanation, setExplanation] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Only fetch if opportunityId is provided
        if (!opportunityId) return

        setLoading(true)
        fetch("/api/ai/match-explanation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ opportunityId }),
        })
            .then((res) => {
                if (!res.ok) {
                    if (res.status === 429) {
                        throw new Error("Rate limit exceeded")
                    }
                    throw new Error("Failed to generate explanation")
                }
                return res.json()
            })
            .then((data) => {
                if (data.success && data.explanation) {
                    setExplanation(data.explanation)
                } else {
                    setError("No explanation available")
                }
            })
            .catch((err) => {
                console.error("[Match Explanation] Error:", err)
                setError(err.message || "Failed to load explanation")
            })
            .finally(() => {
                setLoading(false)
            })
    }, [opportunityId])

    if (variant === "badge") {
        if (loading) {
            return <Skeleton className="h-5 w-32" />
        }
        if (error || !explanation) {
            return null
        }
        return (
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                <Sparkles className="mr-1 h-3 w-3" />
                {explanation}
            </Badge>
        )
    }

    if (variant === "inline") {
        if (loading) {
            return <Skeleton className="h-4 w-full" />
        }
        if (error || !explanation) {
            return null
        }
        return (
            <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
                <Sparkles className="h-4 w-4 text-primary" />
                <span>{explanation}</span>
            </div>
        )
    }

    // Card variant (default)
    return (
        <Card className={className}>
            <CardContent className="p-4">
                {loading && (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                )}
                {error && (
                    <p className="text-sm text-muted-foreground">Unable to generate match explanation</p>
                )}
                {!loading && !error && explanation && (
                    <div className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <p className="text-sm leading-relaxed">{explanation}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

