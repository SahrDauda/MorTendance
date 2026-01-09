import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ReportsClient } from "./reports-client"
import { BarChart3, Users, Calendar } from "lucide-react"
import { db } from "@/lib/db"
import { startOfQuarter, endOfQuarter, parse } from "date-fns"

export const dynamic = 'force-dynamic'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; quarter?: string }>
}) {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  const { year = new Date().getFullYear().toString(), quarter = "Q1" } = await searchParams

  // Calculate date range for the selected quarter
  const quarterMap: Record<string, number> = { "Q1": 0, "Q2": 3, "Q3": 6, "Q4": 9 }
  const month = quarterMap[quarter] || 0
  const startDate = new Date(parseInt(year), month, 1)
  const endDate = endOfQuarter(startDate)

  const [members, groups, attendanceRecords] = await Promise.all([
    db.member.findMany({
      include: {
        _count: {
          select: { attendanceRecords: true }
        }
      }
    }),
    db.ministryGroup.findMany({
      include: {
        members: {
          select: {
            id: true,
            status: true
          }
        }
      }
    }),
    db.attendanceRecord.findMany({
      where: {
        session: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      select: {
        memberId: true,
        isPresent: true
      }
    })
  ])

  // Calculate stats
  const totalMembers = members.length
  const establishedMembers = members.filter(m => m.status === "ESTABLISHED").length
  const newMembersThisQuarter = members.filter(m =>
    m.createdAt >= startDate && m.createdAt <= endDate && m.status === "PRELIMINARY"
  ).length

  const totalAttendanceCount = attendanceRecords.length
  const presentCount = attendanceRecords.filter(a => a.isPresent).length
  const overallAttendanceRate = totalAttendanceCount > 0
    ? Math.round((presentCount / totalAttendanceCount) * 100)
    : 0

  const establishedRatio = totalMembers > 0
    ? Math.round((establishedMembers / totalMembers) * 100)
    : 0

  const reportStats = [
    {
      label: "Overall Attendance",
      value: `${overallAttendanceRate}%`,
      trend: "—",
      trendUp: true,
      iconName: "BarChart3",
    },
    {
      label: "Total Members",
      value: totalMembers.toString(),
      trend: "—",
      trendUp: true,
      iconName: "Users"
    },
    {
      label: "New Members",
      value: newMembersThisQuarter.toString(),
      trend: "—",
      trendUp: true,
      iconName: "Calendar"
    },
    {
      label: "Established Ratio",
      value: `${establishedRatio}%`,
      trend: "—",
      trendUp: true,
      iconName: "Calendar",
    },
  ]

  return (
    <ReportsClient
      reportStats={reportStats as any}
      groups={groups as any}
      attendanceData={attendanceRecords as any}
      initialYear={year}
      initialQuarter={quarter}
    />
  )
}
