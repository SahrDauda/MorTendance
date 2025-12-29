import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ReportsClient } from "./reports-client"
import { BarChart3, Users, Calendar } from "lucide-react"

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

    // Prepare stat cards
    const reportStats = [
      {
        label: "Overall Attendance",
        value: `${attendanceRate}%`,
        trend: "+2.4%",
        trendUp: true,
        icon: BarChart3,
      },
      { label: "Member Growth", value: totalMembers.toString(), trend: "+12", trendUp: true, icon: Users },
      { label: "New Members", value: newMembers.toString(), trend: "+5%", trendUp: true, icon: Calendar },
      {
        label: "Established Ratio",
        value: `${totalMembers > 0 ? Math.round((establishedMembers / totalMembers) * 100) : 0}%`,
        trend: "+5.1%",
        trendUp: true,
        icon: Calendar,
      },
    ]

    // Fetch groups and attendance for detailed table
    const groups = await db.ministryGroup.findMany({
      include: {
        members: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })
    const attendanceData = await db.attendance.findMany({
      select: {
        memberId: true,
        isPresent: true,
      },
    })

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
