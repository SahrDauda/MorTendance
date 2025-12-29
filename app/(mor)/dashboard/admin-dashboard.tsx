import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Users,
    ClipboardCheck,
    TrendingUp,
    Award,
    ShieldCheck,
    Building2,
    ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"

export async function AdminDashboard() {
    // Fetch admin-specific stats
    const totalMembers = await db.member.count()
    const totalLeaders = await db.user.count({ where: { role: "LEADER" } })
    const totalGroups = await db.ministryGroup.count()
    const establishedMembers = await db.member.count({ where: { status: "ESTABLISHED" } })

    // Calculate average attendance
    const totalAttendanceRecords = await db.attendance.count()
    const presentRecords = await db.attendance.count({ where: { isPresent: true } })
    const attendanceRate = totalAttendanceRecords > 0
        ? Math.round((presentRecords / totalAttendanceRecords) * 100)
        : 0

    // Get leaders with their groups
    const leaders = await db.user.findMany({
        where: { role: "LEADER" },
        include: {
            managedGroups: {
                include: {
                    _count: {
                        select: { members: true },
                    },
                },
            },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
    })

    const stats = [
        { name: "Total Members", value: totalMembers.toString(), icon: Users, color: "text-blue-500", trend: "Across all groups" },
        { name: "Leaders", value: totalLeaders.toString(), icon: ShieldCheck, color: "text-purple-500", trend: "Active leaders" },
        { name: "Groups", value: totalGroups.toString(), icon: Building2, color: "text-green-500", trend: "Ministry groups" },
        { name: "Attendance Rate", value: `${attendanceRate}%`, icon: ClipboardCheck, color: "text-amber-500", trend: "Overall consistency" },
    ]

    const quickActions = [
        { name: "Manage Leaders", icon: ShieldCheck, color: "bg-purple-500/10 text-purple-500", href: "/admin/leaders" },
        { name: "Add Member", icon: Users, color: "bg-green-500/10 text-green-500", href: "/members" },
        { name: "View Reports", icon: TrendingUp, color: "bg-blue-500/10 text-blue-500", href: "/reports" },
        { name: "All Members", icon: Award, color: "bg-amber-500/10 text-amber-500", href: "/members" },
    ]

    return (
        <div className="space-y-6 pb-24 lg:pb-12">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 md:p-8 border border-primary/10">
                <div className="relative z-10 flex flex-col gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-base md:text-lg text-muted-foreground max-w-xl">
                            Manage all leaders, members, and ministry groups across the system.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/admin/leaders">
                            <Button className="rounded-full px-6 shadow-lg shadow-primary/20">Manage Leaders</Button>
                        </Link>
                        <Link href="/members">
                            <Button variant="outline" className="rounded-full px-6 bg-background/50 backdrop-blur-sm">All Members</Button>
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

            {/* Recent Leaders */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Leaders</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Recently added leaders and their groups</p>
                    </div>
                    <Link href="/admin/leaders">
                        <Button variant="outline" size="sm">View All</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {leaders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No leaders yet. Add your first leader to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {leaders.map((leader) => (
                                <div
                                    key={leader.id}
                                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <ShieldCheck className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{leader.name}</p>
                                            <p className="text-sm text-muted-foreground">{leader.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {leader.managedGroups.length > 0 ? (
                                            leader.managedGroups.map((group) => (
                                                <Badge key={group.id} variant="secondary">
                                                    {group.name} ({group._count.members})
                                                </Badge>
                                            ))
                                        ) : (
                                            <Badge variant="outline">No groups</Badge>
                                        )}
                                        <Link href={`/admin/leaders/${leader.id}`}>
                                            <Button variant="ghost" size="sm">View</Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

