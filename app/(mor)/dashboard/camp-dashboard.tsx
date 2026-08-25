import { db } from "@/lib/db"
import { CampDashboardClient, CampDashboardData } from "./camp-dashboard-client"

export async function CampDashboard({ currentUserRole }: { currentUserRole: string }) {
  try {
    const [
      campMembers,
      campRooms,
      campGroups,
      campBranches,
      campAttendances,
    ] = await Promise.all([
      db.campMember.findMany({
        orderBy: { createdAt: "desc" },
      }),
      db.campRoom.findMany({
        orderBy: { name: "asc" },
      }),
      db.campGroup.findMany({
        orderBy: { name: "asc" },
      }),
      db.campBranch.findMany({
        orderBy: { name: "asc" },
      }),
      db.campAttendance.findMany({
        select: { id: true },
      }),
    ])

    const totalAttendees = campMembers.length
    const maleAttendees = campMembers.filter((m: any) => m.gender === "Male").length
    const femaleAttendees = campMembers.filter((m: any) => m.gender === "Female").length
    const totalLeaders = campMembers.filter((m: any) => m.position === "Leader").length

    const totalRooms = campRooms.length
    const maleRooms = campRooms.filter((r: any) => r.gender === "Male").length
    const femaleRooms = campRooms.filter((r: any) => r.gender === "Female").length
    const roomsWithLeaders = campRooms.filter((r: any) => Boolean(r.leader)).length

    const totalGroups = campGroups.length
    const groupsWithLeaders = campGroups.filter((g: any) => Boolean(g.leader)).length

    const totalCheckins = campAttendances.length
    const totalBranches = campBranches.length

    // Branch Breakdown
    const branchCounts: { [key: string]: number } = {}
    for (const m of campMembers) {
      const b = m.branch || "Unspecified Branch"
      branchCounts[b] = (branchCounts[b] || 0) + 1
    }

    const branchBreakdown = Object.keys(branchCounts)
      .map((branch) => ({
        branch,
        count: branchCounts[branch],
        percentage: totalAttendees > 0 ? Math.round((branchCounts[branch] / totalAttendees) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // Group Breakdown
    const groupBreakdown = campGroups.map((g: any) => {
      const count = campMembers.filter((m: any) => m.caregroup === g.name).length
      return {
        id: g.id,
        name: g.name,
        leader: g.leader || null,
        color: g.color || null,
        memberCount: count,
      }
    })

    // Room Breakdown
    const roomBreakdown = campRooms.map((r: any) => {
      const occupied = campMembers.filter((m: any) => m.room === r.name).length
      return {
        id: r.id,
        name: r.name,
        gender: r.gender,
        leader: r.leader || null,
        assistant: r.assistant || null,
        occupied,
      }
    })

    // Recent 10 registered attendees
    const recentAttendees = campMembers.slice(0, 10).map((m: any) => ({
      id: m.id,
      badgeId: m.badgeId,
      fullName: m.fullName,
      gender: m.gender,
      phone: m.phone,
      branch: m.branch,
      caregroup: m.caregroup,
      room: m.room,
      position: m.position,
      createdAt: m.createdAt.toISOString(),
    }))

    const data: CampDashboardData = {
      stats: {
        totalAttendees,
        maleAttendees,
        femaleAttendees,
        totalLeaders,
        totalRooms,
        maleRooms,
        femaleRooms,
        roomsWithLeaders,
        totalGroups,
        groupsWithLeaders,
        totalCheckins,
        totalBranches,
      },
      recentAttendees,
      branchBreakdown,
      groupBreakdown,
      roomBreakdown,
    }

    return <CampDashboardClient data={data} currentUserRole={currentUserRole} />
  } catch (error) {
    console.error("CampDashboard error:", error)
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <h1 className="text-2xl font-bold">Error Loading MOR Camp Dashboard</h1>
        <p className="text-muted-foreground">
          There was an error loading camp data. Please try refreshing.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-xs bg-muted p-4 rounded max-w-xl overflow-auto">{String(error)}</pre>
        )}
      </div>
    )
  }
}
