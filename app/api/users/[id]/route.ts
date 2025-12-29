import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, getUserId } from "@/lib/middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    let currentUserId: string | null = null

    try {
      const session = await requireAuth(request)
      currentUserId = getUserId(session)
    } catch (e) {
      // Not authenticated, that's fine for public profiles
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        learnerProfile: true,
        userSkills: {
          include: {
            skill: true,
          },
        },
        credentials: {
          where: {
            visibility: "PUBLIC",
          },
          include: {
            credentialSkills: {
              include: {
                skill: true,
              },
            },
          },
        },
        projects: {
          where: {
            visibility: "PUBLIC",
          },
          include: {
            projectSkills: {
              include: {
                skill: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let connectionStatus = "NONE" // NONE, PENDING, CONNECTED

    if (currentUserId && currentUserId !== userId) {
      // Check for connection
      const connection = await db.connection.findFirst({
        where: {
          OR: [
            { userId: currentUserId, connectedUserId: userId },
            { userId: userId, connectedUserId: currentUserId },
          ],
        },
      })

      if (connection) {
        connectionStatus = "CONNECTED"
      } else {
        // Check for pending request
        const request = await db.connectionRequest.findFirst({
          where: {
            OR: [
              { senderId: currentUserId, receiverId: userId },
              { senderId: userId, receiverId: currentUserId },
            ],
            status: "PENDING",
          },
        })

        if (request) {
          connectionStatus = "PENDING"
        }
      }
    }

    // Remove sensitive information
    const { passwordHash, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      connectionStatus
    })
  } catch (error: any) {
    console.error("Public profile fetch error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    )
  }
}

