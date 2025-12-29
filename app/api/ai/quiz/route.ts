/**
 * Skill Quiz Generation API Endpoint
 * Generates multiple-choice questions for skill verification
 */

import { NextRequest, NextResponse } from "next/server"
import { requireAuth, getUserId } from "@/lib/middleware"
import { getOpenAIClient, getOpenAIModels, withRetry, logAPICall } from "@/lib/openai"
import { checkRateLimit } from "@/lib/ai/rate-limiter"
import { z } from "zod"

const QuizQuestionSchema = z.object({
    question: z.string(),
    options: z.array(z.string()).length(4),
    correctAnswer: z.number().min(0).max(3),
    explanation: z.string().optional(),
})

const QuizSchema = z.object({
    questions: z.array(QuizQuestionSchema).length(3),
    skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
})

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(request)
        const userId = getUserId(session)

        // Rate limiting: 10 requests per user per hour
        const rateLimit = checkRateLimit(userId, 10, 3600000)
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: "Rate limit exceeded. You can generate up to 10 quizzes per hour.",
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
        const { skillName, level = "beginner" } = body

        if (!skillName || typeof skillName !== "string") {
            return NextResponse.json({ error: "skillName is required" }, { status: 400 })
        }

        const models = getOpenAIModels()
        const client = getOpenAIClient()

        const systemPrompt = `You are a technical assessment expert. Generate exactly 3 multiple-choice questions to test ${level} knowledge of a skill.

Each question must have:
- A clear, specific question
- Exactly 4 answer options (A, B, C, D)
- One correct answer (index 0-3)
- Optional explanation for the correct answer

Return JSON with this structure:
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct"
    }
  ],
  "skillLevel": "${level}"
}

Make questions practical and relevant to real-world ${level} usage.`

        const userPrompt = `Generate 3 ${level}-level multiple-choice questions for: ${skillName}`

        const response = await withRetry(async () => {
            return await client.chat.completions.create({
                model: models.llm,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                response_format: { type: "json_object" },
                temperature: 0.3,
                max_tokens: 800, // Enough for 3 questions
            })
        })

        const content = response.choices[0]?.message?.content
        if (!content) {
            throw new Error("No content in OpenAI response")
        }

        const parsed = JSON.parse(content)
        const validated = QuizSchema.parse(parsed)

        // Log API call
        const inputTokens = response.usage?.prompt_tokens || 0
        const outputTokens = response.usage?.completion_tokens || 0
        logAPICall(models.llm, inputTokens, outputTokens, true)

        return NextResponse.json({
            success: true,
            quiz: validated,
            rateLimit: {
                remaining: rateLimit.remaining,
                resetAt: new Date(rateLimit.resetAt).toISOString(),
            },
        })
    } catch (error: any) {
        if (error.status === 401) {
            return error
        }

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: "Invalid quiz format generated",
                    details: error.errors,
                },
                { status: 500 }
            )
        }

        console.error("[Quiz Generator] Error:", error)

        return NextResponse.json(
            {
                error: "Failed to generate quiz. Please try again.",
            },
            { status: 500 }
        )
    }
}

