import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ReportsClient } from "./reports-client"
import { BarChart3, Users, Calendar } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: { year?: string; quarter?: string }
}) {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  // Determine selected year/quarter (default to current)
  const now = new Date()
  const currentYear = now.getFullYear().toString()
  const currentQuarter = `Q${Math.floor(now.getMonth() / 3) + 1}`
  const year = searchParams?.year ?? currentYear
  const quarter = searchParams?.quarter ?? currentQuarter

  // Compute quarter start/end dates
  const quarterStartMonth = (parseInt(quarter[1]) - 1) * 3
  const quarterStart = new Date(parseInt(year), quarterStartMonth, 1)
  const quarterEnd = new Date(parseInt(year), quarterStartMonth + 3, 0)

  try {
    // Core statistics (overall)
    const totalMembers = await db.member.count()
    const establishedMembers = await db.member.count({ where: { status: "ESTABLISHED" } })
    const attendanceRecords = await db.attendance.count({
      where: { date: { gte: quarterStart, lte: quarterEnd } },
    })
    const presentRecords = await db.attendance.count({
      where: { isPresent: true, date: { gte: quarterStart, lte: quarterEnd } },
    })

    const attendanceRate = attendanceRecords > 0 ? Math.round((presentRecords / attendanceRecords) * 100) : 0

    // New members in the selected quarter (using joinedAt)
    const newMembers = await db.member.count({
      where: { joinedAt: { gte: quarterStart, lte: quarterEnd } },
    })

    // Calculate previous quarter for comparison
    const prevQuarterStart = new Date(parseInt(year), quarterStartMonth - 3, 1)
    const prevQuarterEnd = new Date(parseInt(year), quarterStartMonth, 0)

    // Previous quarter attendance
    const prevAttendanceRecords = await db.attendance.count({
      where: { date: { gte: prevQuarterStart, lte: prevQuarterEnd } },
    })
    const prevPresentRecords = await db.attendance.count({
      where: { isPresent: true, date: { gte: prevQuarterStart, lte: prevQuarterEnd } },
    })
    const prevAttendanceRate = prevAttendanceRecords > 0 ? Math.round((prevPresentRecords / prevAttendanceRecords) * 100) : 0

    // Previous quarter members
    const prevTotalMembers = await db.member.count({
      where: { joinedAt: { lte: prevQuarterEnd } },
    })

    // Previous quarter new members
    const prevNewMembers = await db.member.count({
      where: { joinedAt: { gte: prevQuarterStart, lte: prevQuarterEnd } },
    })

    // Previous quarter established
    const prevEstablishedMembers = await db.member.count({
      where: {
        status: "ESTABLISHED",
        joinedAt: { lte: prevQuarterEnd }
      },
    })
    const prevEstablishedRatio = prevTotalMembers > 0 ? Math.round((prevEstablishedMembers / prevTotalMembers) * 100) : 0

    // Calculate trends (only if we have previous quarter data)
    const hasPrevQuarter = prevQuarterStart.getTime() > 0 && prevQuarterEnd.getTime() > 0

    const attendanceTrend = hasPrevQuarter && prevAttendanceRate > 0
      ? ((attendanceRate - prevAttendanceRate) / prevAttendanceRate * 100).toFixed(1)
      : "0.0"
    const memberTrend = hasPrevQuarter && prevTotalMembers > 0
      ? (totalMembers - prevTotalMembers).toString()
      : totalMembers.toString()
    const newMembersTrend = hasPrevQuarter && prevNewMembers > 0
      ? ((newMembers - prevNewMembers) / prevNewMembers * 100).toFixed(1)
      : "0.0"
    const establishedRatio = totalMembers > 0 ? Math.round((establishedMembers / totalMembers) * 100) : 0
    const establishedTrend = hasPrevQuarter && prevEstablishedRatio > 0
      ? ((establishedRatio - prevEstablishedRatio) / prevEstablishedRatio * 100).toFixed(1)
      : "0.0"

    // Prepare stat cards
    const reportStats = [
      {
        label: "Overall Attendance",
        value: `${attendanceRate}%`,
        trend: hasPrevQuarter ? `${parseFloat(attendanceTrend) >= 0 ? "+" : ""}${attendanceTrend}%` : "N/A",
        trendUp: parseFloat(attendanceTrend) >= 0,
        icon: BarChart3,
      },
      {
        label: "Total Members",
        value: totalMembers.toString(),
        trend: hasPrevQuarter ? `${parseInt(memberTrend) >= 0 ? "+" : ""}${memberTrend}` : "N/A",
        trendUp: parseInt(memberTrend) >= 0,
        icon: Users
      },
      {
        label: "New Members",
        value: newMembers.toString(),
        trend: hasPrevQuarter ? `${parseFloat(newMembersTrend) >= 0 ? "+" : ""}${newMembersTrend}%` : "N/A",
        trendUp: parseFloat(newMembersTrend) >= 0,
        icon: Calendar
      },
      {
        label: "Established Ratio",
        value: `${establishedRatio}%`,
        trend: hasPrevQuarter ? `${parseFloat(establishedTrend) >= 0 ? "+" : ""}${establishedTrend}%` : "N/A",
        trendUp: parseFloat(establishedTrend) >= 0,
        icon: Calendar,
      },
    ]

    // Fetch groups and attendance for detailed table (role-based)
    const groups = await db.ministryGroup.findMany({
      where: session.user.role === "LEADER"
        ? { leaderId: session.user.id }
        : {},
      include: {
        members: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    // Get member IDs from the groups
    const groupMemberIds = groups.flatMap((g) => g.members.map((m) => m.id))

    // Fetch attendance data for these members
    const attendanceData = groupMemberIds.length > 0
      ? await db.attendance.findMany({
        where: { memberId: { in: groupMemberIds } },
        select: {
          memberId: true,
          isPresent: true,
        },
      })
      : []

    return (
      <ReportsClient
        reportStats={reportStats}
        groups={groups}
        attendanceData={attendanceData}
        initialYear={year}
        initialQuarter={quarter}
      />
    )
  } catch (error) {
    console.error("Error loading reports:", error)
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <h1 className="text-2xl font-bold">Error Loading Reports</h1>
        <p className="text-muted-foreground">
          There was an error loading the reports. Please try again later.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-xs bg-muted p-4 rounded">{String(error)}</pre>
        )}
      </div>
    )
  }
}
