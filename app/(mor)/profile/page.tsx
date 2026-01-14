import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Shield, Calendar, Phone, MapPin } from "lucide-react"
import { format } from "date-fns"

export default async function ProfilePage() {
    const session = await auth()
    if (!session) redirect("/auth/signin")

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: {
            managedBranch: true,
            managedGroups: true,
            managedCBS: true
        }
    })

    if (!user) redirect("/auth/signin")

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground">Manage your personal information and view your assignments.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <Card className="md:col-span-1 border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <User className="h-12 w-12 text-primary" />
                        </div>
                        <CardTitle>{user.name}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                        <div className="mt-2">
                            <Badge variant="secondary" className="uppercase font-bold text-[10px]">
                                {user.role.replace("_", " ")}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span>{user.role}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Joined {format(user.createdAt, "MMMM yyyy")}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Assignments Card */}
                <Card className="md:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Assignments</CardTitle>
                        <CardDescription>Roles and responsibilities assigned to you.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {user.managedBranch && (
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    <h4 className="font-bold">Branch Head</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">Managing {user.managedBranch.name} Branch</p>
                            </div>
                        )}

                        {user.managedGroups.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Managed Groups</h4>
                                <div className="grid gap-2">
                                    {user.managedGroups.map(group => (
                                        <div key={group.id} className="p-3 rounded-xl bg-muted/30 border border-border/50 flex justify-between items-center">
                                            <span className="font-medium">{group.name}</span>
                                            <Badge variant="outline">Leader</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {user.managedCBS.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">CBS Locations</h4>
                                <div className="grid gap-2">
                                    {user.managedCBS.map(cbs => (
                                        <div key={cbs.id} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-medium">{cbs.name}</span>
                                                <Badge variant="outline">CBS Leader</Badge>
                                            </div>
                                            {cbs.address && <p className="text-xs text-muted-foreground">{cbs.address}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!user.managedBranch && user.managedGroups.length === 0 && user.managedCBS.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No specific assignments found.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
