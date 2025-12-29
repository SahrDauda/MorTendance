import { NextRequest, NextResponse } from "next/server"
import { requireAuth, getUserId, AuthError } from "@/lib/middleware"
import { db } from "@/lib/db"

// Force Node.js runtime for this route (required for Prisma)
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    console.log("Profile API - Starting request")
    console.log("Profile API - Request URL:", request.url)
    console.log("Profile API - Request method:", request.method)
    
    // Get session with better error handling
    let session
    try {
      session = await requireAuth(request)
      console.log("Profile API - Session obtained:", !!session)
    } catch (authError: any) {
      console.error("Profile API - Auth error:", authError)
      if (authError instanceof AuthError) {
        return NextResponse.json(
          { error: "Unauthorized", message: "Please sign in to view your profile" },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { error: "Authentication failed", message: authError.message || "Unable to verify your identity" },
        { status: 401 }
      )
    }
    
    // Get user ID with better error handling
    let userId: string
    try {
      userId = getUserId(session)
      console.log("Profile API - User ID:", userId)
    } catch (idError: any) {
      console.error("Profile API - User ID error:", idError)
      return NextResponse.json(
        { error: "Invalid session", message: "Your session is invalid. Please sign in again." },
        { status: 401 }
      )
    }

    // Fetch user with error handling
    let user
    try {
      user = await db.user.findUnique({
        where: { id: userId },
        include: {
          learnerProfile: true,
          userSkills: {
            include: {
              skill: true,
            },
          },
          credentials: {
            include: {
              credentialSkills: {
                include: {
                  skill: true,
                },
              },
            },
          },
          projects: {
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
    } catch (dbError: any) {
      console.error("Profile API - Database error:", dbError)
      console.error("Profile API - Database error details:", {
        code: dbError?.code,
        message: dbError?.message,
        meta: dbError?.meta,
      })
      
      // Provide more specific error messages based on error type
      let errorMessage = "Unable to fetch user data. Please try again later."
      if (dbError?.code === "P2024") {
        errorMessage = "Database connection timeout. Please try again in a moment."
      } else if (dbError?.code === "P1001") {
        errorMessage = "Cannot reach database server. Please check your internet connection and try again."
      } else if (dbError?.message?.includes("Can't reach database server")) {
        errorMessage = "Cannot connect to the database. Please check your internet connection and ensure the database service is available."
      } else if (dbError?.message) {
        errorMessage = `Database error: ${dbError.message}`
      }
      
      return NextResponse.json(
        { 
          error: "Database error", 
          message: errorMessage,
          code: dbError?.code,
        },
        { status: 500 }
      )
    }

    if (!user) {
      console.error("Profile API - User not found for ID:", userId)
      console.error("Profile API - Session user:", {
        id: session?.user?.id,
        email: session?.user?.email,
        name: session?.user?.name,
      })
      
      // Try to find user by email as fallback
      const sessionUser = session?.user
      if (sessionUser?.email) {
        console.log("Profile API - Trying to find user by email:", sessionUser.email)
        try {
          const userByEmail = await db.user.findUnique({
            where: { email: sessionUser.email },
            include: { 
              learnerProfile: true,
              userSkills: {
                include: {
                  skill: true,
                },
              },
              credentials: {
                include: {
                  credentialSkills: {
                    include: {
                      skill: true,
                    },
                  },
                },
              },
              projects: {
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
          if (userByEmail) {
            console.log("Profile API - Found user by email (ID mismatch):", userByEmail.email)
            console.log("Profile API - Session ID:", userId, "Database ID:", userByEmail.id)
            // Update the session ID if it doesn't match (this is just for logging, the session needs to be refreshed)
            user = userByEmail
          } else {
            console.error("Profile API - User not found by email either:", sessionUser.email)
          }
        } catch (emailError: any) {
          console.error("Profile API - Error finding user by email:", emailError)
        }
      }
      
      if (!user) {
        // User doesn't exist in database - likely session is stale or user was deleted
        console.error("Profile API - User does not exist in database. Session may be invalid.")
        return NextResponse.json(
          { 
            error: "User not found", 
            message: "Your account could not be found. This may happen if your session is outdated. Please try signing out and signing back in. If the problem persists, please contact support." 
          },
          { status: 404 }
        )
      }
    }
    
    console.log("Profile API - User found:", user.email)

    // If learner profile doesn't exist, create it
    if (!user.learnerProfile) {
      try {
        await db.learnerProfile.create({
          data: {
            userId: user.id,
            skillsMatchPercentage: 0,
            verificationStatus: "UNVERIFIED",
          },
        })

        // Fetch user again with the newly created profile
        try {
          user = await db.user.findUnique({
            where: { id: userId },
            include: {
              learnerProfile: true,
              userSkills: {
                include: {
                  skill: true,
                },
              },
              credentials: {
                include: {
                  credentialSkills: {
                    include: {
                      skill: true,
                    },
                  },
                },
              },
              projects: {
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
        } catch (refetchError: any) {
          console.error("Profile API - Error refetching user after profile creation:", refetchError)
          // Continue with existing user object
        }
      } catch (profileError: any) {
        console.error("Profile API - Error creating learner profile:", profileError)
        // Continue even if profile creation fails - user object will still be returned
      }
    }

    // Ensure user object is returned even if profile is null
    if (!user) {
      return NextResponse.json(
        { error: "User not found", message: "Unable to load your profile. Please try again." },
        { status: 404 }
      )
    }

    // Return success response
    return NextResponse.json({ user }, { status: 200 })
  } catch (error: any) {
    // Catch-all error handler
    console.error("Profile API - Unexpected error:", error)
    console.error("Profile API - Error stack:", error?.stack)
    console.error("Profile API - Error details:", {
      name: error?.name,
      code: error?.code,
      message: error?.message,
    })
    
    // Handle specific error types
    if (error instanceof AuthError) {
      return NextResponse.json(
        { 
          error: "Unauthorized",
          message: "Please sign in to view your profile"
        },
        { status: 401 }
      )
    }
    
    // Handle Prisma errors
    if (error?.code?.startsWith('P') || error?.message?.includes("Can't reach database server")) {
      let errorMessage = "Database error occurred. Please try again later."
      if (error.code === "P2024") {
        errorMessage = "Database connection timeout. Please try again in a moment."
      } else if (error.code === "P1001" || error?.message?.includes("Can't reach database server")) {
        errorMessage = "Cannot connect to the database server. Please check:\n1. Your internet connection\n2. The database service is available\n3. Your DATABASE_URL in .env is correct\n4. No firewall is blocking the connection"
      } else if (error.message) {
        errorMessage = `Database error: ${error.message}`
      }
      
      return NextResponse.json(
        { 
          error: "Database error",
          message: errorMessage,
          code: error.code || "P1001",
        },
        { status: 500 }
      )
    }
    
    // Ensure we always return valid JSON
    const errorMessage = error?.message || "Internal server error"
    const statusCode = error?.status || 500
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined
      },
      { status: statusCode }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = getUserId(session)
    const body = await request.json()

    const { 
      name, 
      bio, 
      location, 
      phone,
      website,
      university, 
      major, 
      graduationYear, 
      currentJobTitle,
      currentCompany,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
      avatar,
      coverImage
    } = body

    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar }),
        ...(coverImage !== undefined && { coverImage }),
        learnerProfile: {
          upsert: {
            create: {
              ...(bio !== undefined && { bio }),
              ...(location !== undefined && { location }),
              ...(phone !== undefined && { phone }),
              ...(website !== undefined && { website }),
              ...(university !== undefined && { university }),
              ...(major !== undefined && { major }),
              ...(graduationYear !== undefined && { graduationYear }),
              ...(currentJobTitle !== undefined && { currentJobTitle }),
              ...(currentCompany !== undefined && { currentCompany }),
              ...(linkedinUrl !== undefined && { linkedinUrl }),
              ...(githubUrl !== undefined && { githubUrl }),
              ...(portfolioUrl !== undefined && { portfolioUrl }),
              skillsMatchPercentage: 0,
              verificationStatus: "UNVERIFIED",
            },
            update: {
              ...(bio !== undefined && { bio }),
              ...(location !== undefined && { location }),
              ...(phone !== undefined && { phone }),
              ...(website !== undefined && { website }),
              ...(university !== undefined && { university }),
              ...(major !== undefined && { major }),
              ...(graduationYear !== undefined && { graduationYear }),
              ...(currentJobTitle !== undefined && { currentJobTitle }),
              ...(currentCompany !== undefined && { currentCompany }),
              ...(linkedinUrl !== undefined && { linkedinUrl }),
              ...(githubUrl !== undefined && { githubUrl }),
              ...(portfolioUrl !== undefined && { portfolioUrl }),
            },
          },
        },
      },
      include: {
        learnerProfile: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error: any) {
    // Handle authentication errors
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    )
  }
}

