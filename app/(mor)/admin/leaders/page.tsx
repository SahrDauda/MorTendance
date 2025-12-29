import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LeadersClient } from "./leaders-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldCheck, Users, Building2 } from "lucide-react"

export default async function LeadersPage() {
    const session = await auth()
    if (!session) redirect("/auth/signin")
    if (session.user.role !== "ADMIN") redirect("/dashboard")

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
        orderBy: { createdAt: "desc" },
    })

    const groups = await db.ministryGroup.findMany({
        orderBy: { name: "asc" },
    })

    const totalLeaders = leaders.length
    const totalGroups = groups.length
    const assignedGroups = leaders.filter((l) => l.managedGroups.length > 0).length

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Leaders Management</h1>
                        <p className="text-muted-foreground">Manage fellowship leaders and their group assignments.</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Leaders</p>
                                <p className="text-3xl font-bold mt-1">{totalLeaders}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Groups</p>
                                <p className="text-3xl font-bold mt-1">{totalGroups}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <Building2 className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Assigned Groups</p>
                                <p className="text-3xl font-bold mt-1">{assignedGroups}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-500/10">
                                <ShieldCheck className="h-6 w-6 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <LeadersClient initialLeaders={leaders} groups={groups} />
        </div>
    )
}

