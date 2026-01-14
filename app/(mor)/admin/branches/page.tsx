import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { BranchesClient } from "./branches-client"
import { Building2, Users, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default async function BranchesPage() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") redirect("/dashboard")

    const [branches, leaders] = await Promise.all([
        db.branch.findMany({
            include: {
                head: true,
                _count: {
                    select: {
                        members: true,
                        groups: true,
                        cbsLocations: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        }),
        db.user.findMany({
            where: {
                role: { in: ["ADMIN", "BRANCH_HEAD", "SENIOR_LEADER"] }
            },
            orderBy: { name: 'asc' }
        })
    ])

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Branch Management</h1>
                        <p className="text-muted-foreground">Manage ministry branches, branch heads, and overall structure.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Branches</p>
                            <p className="text-3xl font-bold mt-1">{branches.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/10">
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Groups</p>
                            <p className="text-3xl font-bold mt-1">
                                {branches.reduce((acc, b) => acc + b._count.groups, 0)}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-green-500/10">
                            <Users className="h-6 w-6 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">CBS Locations</p>
                            <p className="text-3xl font-bold mt-1">
                                {branches.reduce((acc, b) => acc + b._count.cbsLocations, 0)}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-500/10">
                            <MapPin className="h-6 w-6 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <BranchesClient
                initialBranches={branches as any}
                leaders={leaders as any}
            />
        </div>
    )
}
