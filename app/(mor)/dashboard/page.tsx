import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Users,
    ClipboardCheck,
    TrendingUp,
    Award,
    PlusCircle,
    FileText,
    Zap,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default async function DashboardPage() {
    const session = await auth()
    if (!session) redirect("/auth/signin")

    // Fetch real stats
    const totalMembers = await db.member.count()
    const establishedMembers = await db.member.count({ where: { status: "ESTABLISHED" } })
    const newMembers = await db.member.count({ where: { status: "PRELIMINARY" } })

    // Calculate average attendance (simplified for dashboard)
    const totalAttendanceRecords = await db.attendance.count()
    const presentRecords = await db.attendance.count({ where: { isPresent: true } })
    const attendanceRate = totalAttendanceRecords > 0
        ? Math.round((presentRecords / totalAttendanceRecords) * 100)
        : 0

    const stats = [
        { name: "Total Members", value: totalMembers.toString(), icon: Users, color: "text-blue-500", trend: "Active members" },
        { name: "Attendance Rate", value: `${attendanceRate}%`, icon: ClipboardCheck, color: "text-green-500", trend: "Overall consistency" },
        { name: "New Members", value: newMembers.toString(), icon: TrendingUp, color: "text-amber-500", trend: "Preliminary status" },
        { name: "Established", value: establishedMembers.toString(), icon: Award, color: "text-purple-500", trend: "Consistent growth" },
    ]

    const quickActions = [
        { name: "Take Attendance", icon: ClipboardCheck, color: "bg-blue-500/10 text-blue-500", href: "/attendance" },
        { name: "Add Member", icon: PlusCircle, color: "bg-green-500/10 text-green-500", href: "/members" },
        { name: "Reports", icon: FileText, color: "bg-purple-500/10 text-purple-500", href: "/reports" },
        { name: "AI Growth", icon: Zap, color: "bg-amber-500/10 text-amber-500", href: "#" },
    ]

    const progressionChecklist = [
        { label: "Record weekly attendance", done: true },
        { label: "Update member status for Doxasmus", done: true },
        { label: "Generate monthly growth report", done: false },
        { label: "Review AI retention insights", done: false },
    ]

    const completionPercent = 50

    return (
        <div className="space-y-6 pb-24 lg:pb-12">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 md:p-8 border border-primary/10">
                <div className="relative z-10 flex flex-col gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Welcome to MOR</h1>
                        <p className="text-base md:text-lg text-muted-foreground max-w-xl">
                            Tracking spiritual growth and fellowship consistency across all ministry groups.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/attendance">
                            <Button className="rounded-full px-6 shadow-lg shadow-primary/20">Quick Attendance</Button>
                        </Link>
                        <Link href="/reports">
                            <Button variant="outline" className="rounded-full px-6 bg-background/50 backdrop-blur-sm">Reports</Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {quickActions.map((action) => (
                    <Link key={action.name} href={action.href}>
                        <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-card/50 border border-border/50 transition-all hover:bg-primary/5 hover:border-primary/20 group backdrop-blur-sm h-full">
                            <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", action.color)}>
                                <action.icon className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                            <span className="text-xs md:text-sm font-semibold text-center">{action.name}</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Stats Dashboard - Moved here below Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat) => (
                    <Card key={stat.name} className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:shadow-lg">
                        <CardContent className="p-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div className={cn("rounded-lg p-2 bg-muted/50 group-hover:bg-primary/10 transition-colors")}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{stat.name}</p>
                                <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    {stat.trend}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Progression & Insights Section */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Left: Progression Checklist */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden h-full">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                </div>
                                <CardTitle className="text-lg">Ministry Tasks</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">Weekly progress</div>
                                <span className="text-2xl font-bold text-primary">{completionPercent}%</span>
                            </div>
                            <Progress value={completionPercent} className="h-2" />
                            <div className="space-y-3 pt-2">
                                {progressionChecklist.map((item) => (
                                    <div key={item.label} className="flex items-center gap-3 text-sm">
                                        <div className={cn(
                                            "flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center transition-all",
                                            item.done
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted-foreground/20"
                                        )}>
                                            {item.done ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />}
                                        </div>
                                        <span className={cn(
                                            "transition-all",
                                            item.done ? "line-through text-muted-foreground" : "font-medium"
                                        )}>
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Insights & Performance */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Growth Insights</CardTitle>
                                <p className="text-sm text-muted-foreground">AI-powered fellowship analysis.</p>
                            </div>
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hidden sm:flex">Live Analysis</Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { title: "Retention Alert", desc: "Huiothesia group shows a 15% increase in consistency.", type: "success" },
                                { title: "Attendance Pattern", desc: "Average attendance peaks on the 2nd week.", type: "info" },
                            ].map((insight, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50 transition-all hover:bg-muted/50">
                                    <div className={cn(
                                        "mt-1 h-2 w-2 rounded-full flex-shrink-0",
                                        insight.type === "success" ? "bg-green-500" : "bg-blue-500"
                                    )} />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                                        <p className="text-sm text-muted-foreground">{insight.desc}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Group Performance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[
                                { name: "Huiothesia", value: 92, color: "bg-blue-500" },
                                { name: "Doxasmus", value: 78, color: "bg-green-500" },
                                { name: "Paligenasia", value: 85, color: "bg-purple-500" },
                            ].map((group) => (
                                <div key={group.name} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{group.name}</span>
                                        <span className="text-muted-foreground font-bold">{group.value}%</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={cn("h-full transition-all duration-1000", group.color)}
                                            style={{ width: `${group.value}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

