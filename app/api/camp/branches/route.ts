import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

const CANONICAL_BRANCHES = ["HQ", "Bo", "Eastern", "New Member"]

export async function GET() {
  try {
    // Ensure the 4 canonical branches always exist
    for (const bName of CANONICAL_BRANCHES) {
      await db.campBranch.upsert({
        where: { name: bName },
        update: {},
        create: {
          name: bName,
          coordinator: bName === "New Member" ? "Follow-up Team" : null,
        },
      })
    }

    const [branches, members] = await Promise.all([
      db.campBranch.findMany({ orderBy: { name: "asc" } }),
      db.campMember.findMany({
        where: { branch: { not: null } },
        select: { branch: true },
      }),
    ])

    const data = branches.map((b: any) => {
      const memberCount = members.filter((m: any) => m.branch === b.name).length
      return {
        ...b,
        leader: b.coordinator || null,
        memberCount,
      }
    })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error fetching camp branches:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch branches" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, leader, coordinator } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Branch name is required" }, { status: 400 })
    }

    const branchLeader = leader !== undefined ? leader : coordinator || null

    const branch = await db.campBranch.upsert({
      where: { name: name.trim() },
      update: { coordinator: branchLeader },
      create: { name: name.trim(), coordinator: branchLeader },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          ...branch,
          leader: branch.coordinator || null,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error saving camp branch:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save branch" },
      { status: 500 }
    )
  }
}
