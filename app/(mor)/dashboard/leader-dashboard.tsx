import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Users,
    ClipboardCheck,
    TrendingUp,
    Award,
    PlusCircle,
    FileText,
    ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import Link from "next/link"

export async function LeaderDashboard() {
    const session = await auth()
    if (!session) return null

    // Get leader's groups
    const leaderGroups = await db.ministryGroup.findMany({
        where: { leaderId: session.user.id },
        include: {
            members: true,
            _count: {
                select: { members: true },
            },
        },
    })

    // Get members in leader's groups
    const groupMemberIds = leaderGroups.flatMap((group) => group.members.map((m) => m.id))

    const totalMembers = await db.member.count({
        where: { id: { in: groupMemberIds } },
    })

    const establishedMembers = await db.member.count({
        where: {
            id: { in: groupMemberIds },
            status: "ESTABLISHED",
        },
    })

    const newMembers = await db.member.count({
        where: {
            id: { in: groupMemberIds },
            status: "PRELIMINARY",
        },
    })

    // Calculate attendance for leader's groups
    const attendanceRecords = await db.attendance.count({
        where: { memberId: { in: groupMemberIds } },
    })

    const presentRecords = await db.attendance.count({
        where: {
            memberId: { in: groupMemberIds },
            isPresent: true,
        },
    })

    const attendanceRate = attendanceRecords > 0
        ? Math.round((presentRecords / attendanceRecords) * 100)
        : 0

    const stats = [
        { name: "My Members", value: totalMembers.toString(), icon: Users, color: "text-blue-500", trend: "In my groups" },
        { name: "Attendance Rate", value: `${attendanceRate}%`, icon: ClipboardCheck, color: "text-green-500", trend: "Group consistency" },
        { name: "New Members", value: newMembers.toString(), icon: TrendingUp, color: "text-amber-500", trend: "Preliminary status" },
        { name: "Established", value: establishedMembers.toString(), icon: Award, color: "text-purple-500", trend: "Consistent growth" },
    ]

    const quickActions = [
        { name: "Take Attendance", icon: ClipboardCheck, color: "bg-blue-500/10 text-blue-500", href: "/attendance" },
        { name: "Add Member", icon: PlusCircle, color: "bg-green-500/10 text-green-500", href: "/members" },
        { name: "Reports", icon: FileText, color: "bg-purple-500/10 text-purple-500", href: "/reports" },
        { name: "My Members", icon: Users, color: "bg-amber-500/10 text-amber-500", href: "/members" },
    ]

    const completionPercent = 50

    return (
        <div className="space-y-6 pb-24 lg:pb-12">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 md:p-8 border border-primary/10">
                <div className="relative z-10 flex flex-col gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Welcome, {session.user.name}</h1>
                        <p className="text-base md:text-lg text-muted-foreground max-w-xl">
                            Manage your fellowship groups and track member growth and consistency.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/attendance">
                            <Button className="rounded-full px-6 shadow-lg shadow-primary/20">Take Attendance</Button>
                        </Link>
                        <Link href="/members">
                            <Button variant="outline" className="rounded-full px-6 bg-background/50 backdrop-blur-sm">My Members</Button>
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

            {/* Stats Dashboard */}
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

            {/* My Groups */}
            {leaderGroups.length > 0 && (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>My Groups</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Groups you are managing</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {leaderGroups.map((group) => {
                                const groupAttendance = attendanceRecords > 0
                                    ? Math.round(
                                        (presentRecords / attendanceRecords) * 100
                                    )
                                    : 0

                                return (
                                    <div
                                        key={group.id}
                                        className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                                    >
                                        <div>
                                            <p className="font-semibold">{group.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {group._count.members} members
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-medium">{groupAttendance}%</p>
                                                <p className="text-xs text-muted-foreground">Attendance</p>
                                            </div>
                                            <Link href={`/attendance?group=${group.id}`}>
                                                <Button variant="outline" size="sm">Manage</Button>
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

