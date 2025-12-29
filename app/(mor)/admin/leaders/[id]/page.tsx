import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ShieldCheck, Users, Building2, Mail, Calendar, Phone, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export const dynamic = 'force-dynamic'

export default async function LeaderDetailPage({ params }: { params: { id: string } }) {
    const session = await auth()
    if (!session) redirect("/auth/signin")
    if (session.user.role !== "ADMIN") redirect("/dashboard")

    const leader = await db.user.findUnique({
        where: { id: params.id, role: "LEADER" },
        include: {
            managedGroups: {
                include: {
                    members: {
                        include: {
                            _count: {
                                select: {
                                    attendance: {
                                        where: { isPresent: true },
                                    },
                                },
                            },
                        },
                        orderBy: { name: "asc" },
                    },
                },
            },
        },
    })

    if (!leader) {
        notFound()
    }

    const totalMembers = leader.managedGroups.reduce(
        (sum, group) => sum + group.members.length,
        0
    )

    const establishedMembers = leader.managedGroups.reduce(
        (sum, group) =>
            sum + group.members.filter((m) => m.status === "ESTABLISHED").length,
        0
    )

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/leaders">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Leaders
                    </Button>
                </Link>
            </div>

            {/* Leader Info Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <ShieldCheck className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">{leader.name}</CardTitle>
                                <CardDescription className="mt-1 flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {leader.email}
                                </CardDescription>
                            </div>
                        </div>
                        <Badge variant="secondary" className="text-lg px-4 py-2">
                            Leader
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Building2 className="h-4 w-4" />
                                Groups Managed
                            </div>
                            <p className="text-2xl font-bold">{leader.managedGroups.length}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Users className="h-4 w-4" />
                                Total Members
                            </div>
                            <p className="text-2xl font-bold">{totalMembers}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Calendar className="h-4 w-4" />
                                Account Created
                            </div>
                            <p className="text-sm font-medium">
                                {format(new Date(leader.createdAt), "MMM d, yyyy")}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Groups and Members */}
            {leader.managedGroups.length === 0 ? (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="py-12 text-center">
                        <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground">This leader is not assigned to any groups yet.</p>
                    </CardContent>
                </Card>
            ) : (
                leader.managedGroups.map((group) => (
                    <Card key={group.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-primary" />
                                        {group.name}
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                                    </CardDescription>
                                </div>
                                <Badge variant="outline">
                                    {group.members.filter((m) => m.status === "ESTABLISHED").length} Established
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {group.members.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground">No members in this group yet.</p>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Attendance</TableHead>
                                                <TableHead>Joined</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {group.members.map((member) => (
                                                <TableRow key={member.id}>
                                                    <TableCell className="font-medium">{member.name}</TableCell>
                                                    <TableCell>
                                                        {member.phoneNumber ? (
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                                {member.phoneNumber}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                member.status === "ESTABLISHED"
                                                                    ? "default"
                                                                    : member.status === "SEMI_CONSISTENT"
                                                                        ? "secondary"
                                                                        : "outline"
                                                            }
                                                        >
                                                            {member.status.replace("_", " ")}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4 text-muted-foreground" />
                                                            {member._count.attendance} sessions
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {format(new Date(member.joinedAt), "MMM d, yyyy")}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    )
}

