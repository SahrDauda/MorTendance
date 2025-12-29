/**
 * Resume Parsing API Endpoint
 * Accepts PDF file upload and returns structured resume data
 */

import { NextRequest, NextResponse } from "next/server"
import { requireAuth, getUserId } from "@/lib/middleware"
import { parseResume } from "@/lib/ai/resume-parser"
import { checkRateLimit } from "@/lib/ai/rate-limiter"
import pdf from "pdf-parse"

export const runtime = "nodejs"
export const maxDuration = 30 // 30 seconds timeout

export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(request)
        const userId = getUserId(session)

        // Rate limiting: 5 requests per user per hour
        const rateLimit = checkRateLimit(userId, 5, 3600000)
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: "Rate limit exceeded. You can parse up to 5 resumes per hour.",
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": "3600",
                        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
                        "X-RateLimit-Reset": new Date(rateLimit.resetAt).toISOString(),
                    },
                }
            )
        }

        // Get form data
        const formData = await request.formData()
        const file = formData.get("file") as File | null

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Validate file type
        if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
            return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 })
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File size exceeds 10MB limit" },
                { status: 400 }
            )
        }

        // Read file buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Extract text from PDF
        let text: string
        try {
            const pdfData = await pdf(buffer)
            text = pdfData.text
        } catch (parseError: any) {
            if (parseError.message?.includes("password")) {
                return NextResponse.json(
                    { error: "Password-protected PDFs are not supported" },
                    { status: 400 }
                )
            }
            if (parseError.message?.includes("corrupt") || parseError.message?.includes("invalid")) {
                return NextResponse.json(
                    { error: "Invalid or corrupted PDF file" },
                    { status: 400 }
                )
            }
            return NextResponse.json(
                { error: "Failed to extract text from PDF. Please ensure it's a valid PDF file." },
                { status: 400 }
            )
        }

        if (!text || text.trim().length < 50) {
            return NextResponse.json(
                { error: "PDF appears to be empty or contains too little text" },
                { status: 400 }
            )
        }

        // Parse resume using AI
        const parsedData = await parseResume(text)

        return NextResponse.json({
            success: true,
            data: parsedData,
            rateLimit: {
                remaining: rateLimit.remaining,
                resetAt: new Date(rateLimit.resetAt).toISOString(),
            },
        })
    } catch (error: any) {
        if (error.status === 401) {
            return error
        }

        console.error("[Resume Parser] Error:", error)

        // Don't expose internal errors
        return NextResponse.json(
            {
                error: "Failed to parse resume. Please try again or upload a different file.",
            },
            { status: 500 }
        )
    }
}

