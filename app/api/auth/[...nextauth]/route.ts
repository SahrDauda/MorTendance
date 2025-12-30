import { handlers } from "@/lib/auth"

import { NextRequest } from "next/server"

const { GET: originalGET, POST: originalPOST } = handlers

export const GET = async (req: NextRequest) => {
    console.log("[Auth API] GET request received:", req.url)
    return originalGET(req)
}

export const POST = async (req: NextRequest) => {
    console.log("[Auth API] POST request received:", req.url)
    return originalPOST(req)
}

// Add error handling
export const runtime = 'nodejs'
