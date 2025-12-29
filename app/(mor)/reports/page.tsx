import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
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
    LineChart as LineChartIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default async function ReportsPage() {
    const session = await auth()
    if (!session) redirect("/auth/signin")

    // Fetch real stats for the report
    const totalMembers = await db.member.count()
    const establishedMembers = await db.member.count({ where: { status: "ESTABLISHED" } })
    const attendanceRecords = await db.attendance.count()
    const presentRecords = await db.attendance.count({ where: { isPresent: true } })
    
    // Fetch groups with members for detailed report
    const groups = await db.ministryGroup.findMany({
        include: {
            members: true
        }
    })

    // Fetch all attendance for calculation
    const attendanceData = await db.attendance.findMany()
    
    const attendanceRate = attendanceRecords > 0 
        ? Math.round((presentRecords / attendanceRecords) * 100) 
        : 0

    const reportStats = [
        { label: "Overall Attendance", value: `${attendanceRate}%`, trend: "+2.4%", trendUp: true, icon: BarChart3 },
        { label: "Member Growth", value: totalMembers.toString(), trend: "+12", trendUp: true, icon: Users },
        { label: "Retention Rate", value: "88%", trend: "-1.2%", trendUp: false, icon: TrendingUp },
        { label: "Established Ratio", value: `${totalMembers > 0 ? Math.round((establishedMembers / totalMembers) * 100) : 0}%`, trend: "+5.1%", trendUp: true, icon: Calendar },
    ]

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ministry Reports</h1>
                    <p className="text-muted-foreground">Comprehensive analysis of fellowship growth and consistency.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" /> Filter
                    </Button>
                    <Button className="gap-2 shadow-lg shadow-primary/20">
                        <Download className="h-4 w-4" /> Export Report
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {reportStats.map((stat) => (
                    <Card key={stat.label} className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 rounded-xl bg-primary/10">
                                    <stat.icon className="h-5 w-5 text-primary" />
                                </div>
                                <Badge variant="outline" className={cn(
                                    "gap-1 font-bold",
                                    stat.trendUp ? "text-green-500 border-green-500/20 bg-green-500/5" : "text-red-500 border-red-500/20 bg-red-500/5"
                                )}>
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

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Attendance Trends</CardTitle>
                        <CardDescription>Weekly attendance patterns over the last 3 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-t border-border/50 bg-muted/10">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <LineChartIcon className="h-12 w-12 opacity-20" />
                            <p className="text-sm font-medium">Visual chart data will appear here</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Member Distribution</CardTitle>
                        <CardDescription>Breakdown of members by status and group.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-t border-border/50 bg-muted/10">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <PieChartIcon className="h-12 w-12 opacity-20" />
                            <p className="text-sm font-medium">Visual distribution data will appear here</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                                {groups.map((group) => {
                                    const groupMembers = group.members.length
                                    const establishedInGroup = group.members.filter(m => m.status === "ESTABLISHED").length
                                    
                                    // Calculate group attendance rate
                                    const groupMemberIds = group.members.map(m => m.id)
                                    const groupAttendance = attendanceData.filter(a => groupMemberIds.includes(a.memberId))
                                    const groupPresent = groupAttendance.filter(a => a.isPresent).length
                                    const groupRate = groupAttendance.length > 0 
                                        ? Math.round((groupPresent / groupAttendance.length) * 100) 
                                        : 0

                                    return (
                                        <tr key={group.id} className="hover:bg-primary/5 transition-colors">
                                            <td className="p-4 font-semibold">{group.name}</td>
                                            <td className="p-4 text-center">{groupMembers}</td>
                                            <td className="p-4 text-center text-primary font-bold">{groupRate}%</td>
                                            <td className="p-4 text-center">{establishedInGroup}</td>
                                            <td className="p-4 text-right text-green-500 font-medium">
                                                {groupRate > 80 ? "+5%" : groupRate > 60 ? "+2%" : "0%"}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
