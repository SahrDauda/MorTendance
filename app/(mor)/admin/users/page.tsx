import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { UsersClient } from "./users-client"
import { UserCog, Shield, UserCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") redirect("/dashboard")

    const users = await db.user.findMany({
        include: {
            managedBranch: true,
            managedGroups: true,
            managedCBS: true
        },
        orderBy: { name: 'asc' }
    })

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <UserCog className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                        <p className="text-muted-foreground">Manage system users, assign roles, and control access levels.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                            <p className="text-3xl font-bold mt-1">{users.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/10">
                            <UserCog className="h-6 w-6 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Admins</p>
                            <p className="text-3xl font-bold mt-1">{users.filter(u => u.role === "ADMIN").length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-green-500/10">
                            <Shield className="h-6 w-6 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Active Leaders</p>
                            <p className="text-3xl font-bold mt-1">{users.filter(u => u.role.includes("LEADER")).length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-500/10">
                            <UserCheck className="h-6 w-6 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <UsersClient initialUsers={users as any} />
        </div>
    )
}
