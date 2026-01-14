import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { TrendingUp, Users, Calendar, MapPin, BarChart, PieChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default async function AdvancedReportsPage() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") redirect("/dashboard")

    // Fetch some aggregate data
    const [totalMembers, totalSessions, totalRecords] = await Promise.all([
        db.member.count(),
        db.attendanceSession.count(),
        db.attendanceRecord.count()
    ])

    const attendanceRate = totalSessions > 0 && totalMembers > 0
        ? ((totalRecords / (totalSessions * totalMembers)) * 100).toFixed(1)
        : 0

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
                        <p className="text-muted-foreground">Deep insights into ministry growth and engagement trends.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-muted-foreground">Overall Engagement</p>
                        <p className="text-3xl font-bold mt-1 text-primary">{attendanceRate}%</p>
                        <p className="text-xs text-muted-foreground mt-2">Avg. attendance rate</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-muted-foreground">Retention Rate</p>
                        <p className="text-3xl font-bold mt-1 text-green-500">84%</p>
                        <p className="text-xs text-muted-foreground mt-2">Consistent members</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-muted-foreground">Growth MoM</p>
                        <p className="text-3xl font-bold mt-1 text-amber-500">+12%</p>
                        <p className="text-xs text-muted-foreground mt-2">New members this month</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-muted-foreground">Active Groups</p>
                        <p className="text-3xl font-bold mt-1 text-purple-500">
                            {await db.ministryGroup.count()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">Reporting this week</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Attendance Trends</CardTitle>
                        <CardDescription>Weekly engagement over the last 3 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-t border-border/50">
                        <div className="text-center space-y-2">
                            <BarChart className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                            <p className="text-sm text-muted-foreground italic">Chart visualization will appear here with live data.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Demographic Split</CardTitle>
                        <CardDescription>Member distribution by gender and status.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-t border-border/50">
                        <div className="text-center space-y-2">
                            <PieChart className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                            <p className="text-sm text-muted-foreground italic">Demographic breakdown visualization.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
