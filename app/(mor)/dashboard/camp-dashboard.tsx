import { db } from "@/lib/db"
import { CampDashboardClient, CampDashboardData } from "./camp-dashboard-client"
import { CAMP_SCHEDULE } from "@/lib/campSchedule"

export const dynamic = "force-dynamic"

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
        select: {
          id: true,
          memberId: true,
          session: true,
          isPresent: true,
          isLate: true,
          scannedAt: true,
        },
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

    const totalCheckins = campAttendances.filter((a: any) => a.isPresent).length
    const totalBranches = campBranches.length

    // Active session attendance calculation
    const defaultSession = CAMP_SCHEDULE[0].name
    const sessionAttendanceMap = new Map<string, Set<string>>()

    for (const att of campAttendances) {
      if (att.isPresent) {
        if (!sessionAttendanceMap.has(att.session)) {
          sessionAttendanceMap.set(att.session, new Set())
        }
        sessionAttendanceMap.get(att.session)!.add(att.memberId)
      }
    }

    const presentInDefault = sessionAttendanceMap.get(defaultSession) || new Set<string>()

    const flaggedAbsentMembers = campMembers
      .filter((m: any) => !presentInDefault.has(m.id))
      .map((m: any) => ({
        id: m.id,
        badgeId: m.badgeId,
        fullName: m.fullName,
        phone: m.phone,
        branch: m.branch,
        caregroup: m.caregroup,
        position: m.position,
        gender: m.gender,
      }))

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
      flaggedAbsentMembers,
      recentAttendees,
      branchBreakdown,
      groupBreakdown,
      roomBreakdown,
    }

    return <CampDashboardClient data={data} currentUserRole={currentUserRole} />
  } catch (error) {
    console.error("Error loading CampDashboard:", error)
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">Failed to load dashboard</h2>
        <p className="text-sm text-muted-foreground mt-2">
          An error occurred while connecting to the camp database.
        </p>
      </div>
    )
  }
}
