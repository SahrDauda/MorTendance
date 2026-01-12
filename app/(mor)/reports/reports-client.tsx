"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    BarChart3,
    TrendingUp,
    Users,
    Calendar,
    Download,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    PieChart as PieChartIcon,
    LineChart as LineChartIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { format } from "date-fns"

interface ReportStat {
    label: string
    value: string
    trend: string
    trendUp: boolean
    iconName: "BarChart3" | "Users" | "Calendar"
}

const iconMap = {
    BarChart3,
    Users,
    Calendar,
}

interface Group {
    id: string
    name: string
    members: Array<{
        id: string
        status: string
    }>
}

interface AttendanceRecord {
    memberId: string
    isPresent: boolean
}

interface ReportsClientProps {
    reportStats: ReportStat[]
    groups: Group[]
    attendanceData: AttendanceRecord[]
    initialYear: string
    initialQuarter: string
}

export function ReportsClient({
    reportStats,
    groups,
    attendanceData,
    initialYear,
    initialQuarter,
}: ReportsClientProps) {
    const router = useRouter()
    const [year, setYear] = useState(initialYear)
    const [quarter, setQuarter] = useState(initialQuarter)

    // Sync with initial props when they change (e.g., after navigation)
    useEffect(() => {
        setYear(initialYear)
        setQuarter(initialQuarter)
    }, [initialYear, initialQuarter])

    const handleYearChange = (value: string) => {
        setYear(value)
        const params = new URLSearchParams(window.location.search)
        params.set("year", value)
        router.push(`/reports?${params.toString()}`)
    }

    const handleQuarterChange = (value: string) => {
        setQuarter(value)
        const params = new URLSearchParams(window.location.search)
        params.set("quarter", value)
        router.push(`/reports?${params.toString()}`)
    }

    const exportToCSV = () => {
        const data = groups.map(g => {
            const groupMembers = g.members.length
            const establishedInGroup = g.members.filter((m) => m.status === "ESTABLISHED").length
            const groupMemberIds = g.members.map((m) => m.id)
            const groupAttendance = attendanceData.filter((a) => groupMemberIds.includes(a.memberId))
            const groupPresent = groupAttendance.filter((a) => a.isPresent).length
            const groupRate = groupAttendance.length > 0 ? Math.round((groupPresent / groupAttendance.length) * 100) : 0

            return {
                "Group Name": g.name,
                "Total Members": groupMembers,
                "Avg. Attendance": `${groupRate}%`,
                "Established Members": establishedInGroup
            }
        })

        const headers = ["Group Name", "Total Members", "Avg. Attendance", "Established Members"]
        const csvContent = [
            headers.join(","),
            ...data.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.setAttribute("download", `mor_report_${year}_${quarter}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const exportToExcel = () => {
        const data = groups.map(g => {
            const groupMembers = g.members.length
            const establishedInGroup = g.members.filter((m) => m.status === "ESTABLISHED").length
            const groupMemberIds = g.members.map((m) => m.id)
            const groupAttendance = attendanceData.filter((a) => groupMemberIds.includes(a.memberId))
            const groupPresent = groupAttendance.filter((a) => a.isPresent).length
            const groupRate = groupAttendance.length > 0 ? Math.round((groupPresent / groupAttendance.length) * 100) : 0

            return {
                "Group Name": g.name,
                "Total Members": groupMembers,
                "Avg. Attendance": `${groupRate}%`,
                "Established Members": establishedInGroup
            }
        })
        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ministry Report")
        XLSX.writeFile(workbook, `mor_report_${year}_${quarter}.xlsx`)
    }

    const exportToPDF = () => {
        const doc = new jsPDF()
        doc.text(`MOR Ministry Report - ${year} ${quarter}`, 14, 15)

        const tableData = groups.map(g => {
            const groupMembers = g.members.length
            const establishedInGroup = g.members.filter((m) => m.status === "ESTABLISHED").length
            const groupMemberIds = g.members.map((m) => m.id)
            const groupAttendance = attendanceData.filter((a) => groupMemberIds.includes(a.memberId))
            const groupPresent = groupAttendance.filter((a) => a.isPresent).length
            const groupRate = groupAttendance.length > 0 ? Math.round((groupPresent / groupAttendance.length) * 100) : 0

            return [
                g.name,
                groupMembers.toString(),
                `${groupRate}%`,
                establishedInGroup.toString()
            ]
        })

            ; (doc as any).autoTable({
                head: [["Group Name", "Total Members", "Avg. Attendance", "Established"]],
                body: tableData,
                startY: 25,
            })
        doc.save(`mor_report_${year}_${quarter}.pdf`)
    }

    // Safety check
    if (!reportStats || !groups || !attendanceData) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <h1 className="text-2xl font-bold">Loading Reports...</h1>
                <p className="text-muted-foreground">Please wait while we load the reports data.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header with filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ministry Reports</h1>
                    <p className="text-muted-foreground">
                        Comprehensive analysis of fellowship growth and consistency.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Year selector */}
                    <Select value={year} onValueChange={handleYearChange}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {[...Array(5)].map((_, i) => {
                                const y = (new Date().getFullYear() - i).toString()
                                return (
                                    <SelectItem key={y} value={y}>
                                        {y}
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                    {/* Quarter selector */}
                    <Select value={quarter} onValueChange={handleQuarterChange}>
                        <SelectTrigger className="w-[80px]">
                            <SelectValue placeholder="Quarter" />
                        </SelectTrigger>
                        <SelectContent>
                            {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                                <SelectItem key={q} value={q}>
                                    {q}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" /> Filter
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="gap-2 shadow-lg shadow-primary/20">
                                <Download className="h-4 w-4" /> Export Report
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={exportToPDF}>Export as PDF</DropdownMenuItem>
                            <DropdownMenuItem onClick={exportToCSV}>Export as CSV</DropdownMenuItem>
                            <DropdownMenuItem onClick={exportToExcel}>Export as Excel</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {reportStats.map((stat) => (
                    <Card key={stat.label} className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 rounded-xl bg-primary/10">
                                    {(() => {
                                        const Icon = iconMap[stat.iconName]
                                        return <Icon className="h-5 w-5 text-primary" />
                                    })()}
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "gap-1 font-bold",
                                        stat.trendUp
                                            ? "text-green-500 border-green-500/20 bg-green-500/5"
                                            : "text-red-500 border-red-500/20 bg-red-500/5",
                                    )}
                                >
                                    {stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {stat.trend}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts placeholders */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Attendance Trend Line Chart */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Attendance Trends</CardTitle>
                        <CardDescription>Attendance over the selected quarter.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <LineChartIcon className="h-12 w-12 opacity-20" />
                        <p className="ml-2 text-sm">Chart coming soon</p>
                    </CardContent>
                </Card>

                {/* Member Distribution Pie Chart */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Member Distribution</CardTitle>
                        <CardDescription>Members by status for the selected quarter.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <PieChartIcon className="h-12 w-12 opacity-20" />
                        <p className="ml-2 text-sm">Chart coming soon</p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Group Performance table */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Detailed Group Performance</CardTitle>
                    <CardDescription>Comparative analysis of all ministry groups.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/20 border-y border-border/50">
                                <tr>
                                    <th className="text-left p-4 font-bold uppercase tracking-wider text-[10px]">Group Name</th>
                                    <th className="text-center p-4 font-bold uppercase tracking-wider text-[10px]">Members</th>
                                    <th className="text-center p-4 font-bold uppercase tracking-wider text-[10px]">Avg. Attendance</th>
                                    <th className="text-center p-4 font-bold uppercase tracking-wider text-[10px]">Established</th>
                                    <th className="text-right p-4 font-bold uppercase tracking-wider text-[10px]">Growth</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {groups.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            No groups found. Add groups and members to see reports.
                                        </td>
                                    </tr>
                                ) : (
                                    groups.map((group) => {
                                        const groupMembers = group.members.length
                                        const establishedInGroup = group.members.filter((m) => m.status === "ESTABLISHED").length
                                        const groupMemberIds = group.members.map((m) => m.id)
                                        const groupAttendance = attendanceData.filter((a) => groupMemberIds.includes(a.memberId))
                                        const groupPresent = groupAttendance.filter((a) => a.isPresent).length
                                        const groupRate = groupAttendance.length > 0 ? Math.round((groupPresent / groupAttendance.length) * 100) : 0
                                        return (
                                            <tr key={group.id} className="hover:bg-primary/5 transition-colors">
                                                <td className="p-4 font-semibold">{group.name}</td>
                                                <td className="p-4 text-center">{groupMembers}</td>
                                                <td className="p-4 text-center text-primary font-bold">{groupRate}%</td>
                                                <td className="p-4 text-center">{establishedInGroup}</td>
                                                <td className="p-4 text-right text-muted-foreground font-medium">
                                                    —
                                                </td>
                                            </tr>
                                        )
                                    }))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

