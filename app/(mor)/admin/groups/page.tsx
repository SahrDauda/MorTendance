import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { GroupsClient } from "./groups-client"
import { Users, Building2, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default async function GroupsPage() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") redirect("/dashboard")

    const [groups, branches, leaders] = await Promise.all([
        db.ministryGroup.findMany({
            include: {
                branch: true,
                leader: true,
                _count: {
                    select: { members: true }
                }
            },
            orderBy: { name: 'asc' }
        }),
        db.branch.findMany({ orderBy: { name: 'asc' } }),
        db.user.findMany({
            where: {
                role: { in: ["SENIOR_LEADER", "JUNIOR_LEADER", "PROBATION_LEADER"] }
            },
            include: {
                managedBranch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { name: 'asc' }
        })
    ])

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Group Management</h1>
                        <p className="text-muted-foreground">Manage ministry groups, assign leaders, and track membership.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Groups</p>
                            <p className="text-3xl font-bold mt-1">{groups.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/10">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Active Branches</p>
                            <p className="text-3xl font-bold mt-1">{branches.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-green-500/10">
                            <Building2 className="h-6 w-6 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Assigned Leaders</p>
                            <p className="text-3xl font-bold mt-1">{groups.filter(g => g.leaderId).length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-500/10">
                            <ShieldCheck className="h-6 w-6 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <GroupsClient
                initialGroups={groups as any}
                branches={branches as any}
                leaders={leaders as any}
            />
        </div>
    )
}
