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

  const year = searchParams?.year ?? "2024"
  const quarter = searchParams?.quarter ?? "Q1"

  console.log("[ReportsPage] Using mock data")

  // Mock stat cards
  const reportStats = [
    {
      label: "Overall Attendance",
      value: "82%",
      trend: "+5.2%",
      trendUp: true,
      icon: BarChart3,
    },
    {
      label: "Total Members",
      value: "156",
      trend: "+12",
      trendUp: true,
      icon: Users
    },
    {
      label: "New Members",
      value: "8",
      trend: "-2.1%",
      trendUp: false,
      icon: Calendar
    },
    {
      label: "Established Ratio",
      value: "64%",
      trend: "+3.4%",
      trendUp: true,
      icon: Calendar,
    },
  ]

  // Mock groups
  const groups = [
    {
      id: "group-1",
      name: "Huiothesia",
      members: Array.from({ length: 12 }).map((_, i) => ({
        id: `m${i}`,
        status: i % 3 === 0 ? "ESTABLISHED" : "PRELIMINARY"
      }))
    }
  ]

  // Mock attendance data
  const attendanceData = groups[0].members.map(m => ({
    memberId: m.id,
    isPresent: Math.random() > 0.2
  }))

  return (
    <ReportsClient
      reportStats={reportStats as any}
      groups={groups as any}
      attendanceData={attendanceData as any}
      initialYear={year}
      initialQuarter={quarter}
    />
  )
}
