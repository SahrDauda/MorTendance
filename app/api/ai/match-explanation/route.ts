/**
 * Match Explanation API Endpoint
 * Generates AI-powered explanation for why an opportunity matches a user
 */

import { NextRequest, NextResponse } from "next/server"
import { requireAuth, getUserId } from "@/lib/middleware"
import { generateMatchExplanation } from "@/lib/ai/match-explanations"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/ai/rate-limiter"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(request)
        const userId = getUserId(session)

        // Rate limiting: 20 requests per user per hour
        const rateLimit = checkRateLimit(userId, 20, 3600000)
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: "Rate limit exceeded. Please try again later.",
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": "3600",
                        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
                    },
                }
            )
        }

        const body = await request.json()
        const { opportunityId } = body

        if (!opportunityId) {
            return NextResponse.json({ error: "opportunityId is required" }, { status: 400 })
        }

        // Fetch user profile
        const user = await db.user.findUnique({
            where: { id: userId },
            include: {
                learnerProfile: true,
                userSkills: {
                    include: {
                        skill: true,
                    },
                },
            },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Fetch opportunity
        const opportunity = await db.opportunity.findUnique({
            where: { id: opportunityId },
            include: {
                opportunitySkills: {
                    include: {
                        skill: true,
                    },
                },
            },
        })

        if (!opportunity) {
            return NextResponse.json({ error: "Opportunity not found" }, { status: 404 })
        }

        // Prepare user profile data
        const userProfile = {
            name: user.name,
            skills: user.userSkills.map((us) => us.skill.name),
            location: user.learnerProfile?.location || undefined,
            currentJobTitle: user.learnerProfile?.currentJobTitle || undefined,
            currentCompany: user.learnerProfile?.currentCompany || undefined,
            university: user.learnerProfile?.university || undefined,
            major: user.learnerProfile?.major || undefined,
        }

        // Prepare opportunity data
        const oppData = {
            title: opportunity.title,
            company: opportunity.company,
            description: opportunity.description,
            location: opportunity.location,
            remote: opportunity.remote,
            requiredSkills: opportunity.opportunitySkills.map((os) => os.skill.name),
        }

        // Generate match explanation
        const explanation = await generateMatchExplanation(userProfile, oppData)

        return NextResponse.json({
            success: true,
            explanation: explanation.explanation,
            confidence: explanation.confidence,
            rateLimit: {
                remaining: rateLimit.remaining,
                resetAt: new Date(rateLimit.resetAt).toISOString(),
            },
        })
    } catch (error: any) {
        if (error.status === 401) {
            return error
        }

        console.error("[Match Explanation] Error:", error)

        return NextResponse.json(
            {
                error: "Failed to generate match explanation. Please try again.",
            },
            { status: 500 }
        )
    }
}

