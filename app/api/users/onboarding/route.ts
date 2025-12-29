import { NextRequest, NextResponse } from "next/server"
import { requireAuth, getUserId } from "@/lib/middleware"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  try {
    const limited = await rateLimit(request, "onboarding_status", 30, 60_000)
    if (!limited.ok) return limited.response

    const session = await requireAuth(request)
    const userId = getUserId(session)

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        onboarded: true,
        learnerProfile: {
          select: {
            bio: true,
            location: true,
            university: true,
            major: true,
            graduationYear: true,
          },
        },
      },
    })

    // Completed if explicitly flagged, otherwise fall back to profile presence
    const hasProfileData = user?.learnerProfile && (
      user.learnerProfile.bio ||
      user.learnerProfile.location ||
      user.learnerProfile.university ||
      user.learnerProfile.major
    )

    const completed = Boolean(user?.onboarded || hasProfileData)

    return NextResponse.json({
      completed,
      hasProfileData: !!hasProfileData,
    })
  } catch (error: any) {
    if (error.status === 401) {
      return error
    }
    console.error("Onboarding status fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const limited = await rateLimit(request, "onboarding_complete", 20, 60_000)
    if (!limited.ok) return limited.response

    const session = await requireAuth(request)
    const userId = getUserId(session)
    const body = await request.json()

    await db.learnerProfile.upsert({
      where: { userId },
      create: {
        userId,
        skillsMatchPercentage: 0,
        verificationStatus: "UNVERIFIED",
      },
      update: {},
    })

    // Mark user as onboarded
    await db.user.update({
      where: { id: userId },
      data: { onboarded: true },
    })

    return NextResponse.json({ completed: true })
  } catch (error: any) {
    if (error.status === 401) {
      return error
    }
    console.error("Onboarding completion error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

