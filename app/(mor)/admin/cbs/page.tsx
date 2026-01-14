import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { CBSClient } from "./cbs-client"
import { MapPin, Users, Building2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default async function CBSPage() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") redirect("/dashboard")

    const [cbsLocations, branches, leaders] = await Promise.all([
        db.cBSLocation.findMany({
            include: {
                branch: true,
                leader: true,
                _count: {
                    select: { attendanceSessions: true }
                }
            },
            orderBy: { name: 'asc' }
        }),
        db.branch.findMany({ orderBy: { name: 'asc' } }),
        db.user.findMany({
            where: {
                role: { in: ["SENIOR_LEADER", "JUNIOR_LEADER", "PROBATION_LEADER"] }
            },
            orderBy: { name: 'asc' }
        })
    ])

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">CBS Management</h1>
                        <p className="text-muted-foreground">Manage CBS locations, addresses, and assigned leaders.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Locations</p>
                            <p className="text-3xl font-bold mt-1">{cbsLocations.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/10">
                            <MapPin className="h-6 w-6 text-primary" />
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
                            <p className="text-3xl font-bold mt-1">{cbsLocations.filter(l => l.leaderId).length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-500/10">
                            <Users className="h-6 w-6 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <CBSClient
                initialLocations={cbsLocations as any}
                branches={branches as any}
                leaders={leaders as any}
            />
        </div>
    )
}
