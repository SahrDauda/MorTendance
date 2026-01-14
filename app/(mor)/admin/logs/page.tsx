import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { History, User, Activity, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export const dynamic = 'force-dynamic'

export default async function AuditLogsPage() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") redirect("/dashboard")

    const logs = await db.auditLog.findMany({
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    role: true
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
    })

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <History className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                        <p className="text-muted-foreground">Track all administrative actions and system changes.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Actions</p>
                            <p className="text-3xl font-bold mt-1">{logs.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/10">
                            <Activity className="h-6 w-6 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Last 24 Hours</p>
                            <p className="text-3xl font-bold mt-1">
                                {logs.filter(l => new Date(l.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-green-500/10">
                            <Clock className="h-6 w-6 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Active Admins</p>
                            <p className="text-3xl font-bold mt-1">
                                {new Set(logs.map(l => l.userId)).size}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-500/10">
                            <User className="h-6 w-6 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-muted/20">
                    <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/50 bg-muted/20">
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">User</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Action</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Entity</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Details</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px] text-right">Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id} className="border-border/50 hover:bg-primary/5 transition-colors">
                                    <TableCell>
                                        <div className="font-semibold text-sm">{log.user.name}</div>
                                        <div className="text-[10px] text-muted-foreground">{log.user.role}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={log.action === "CREATE" ? "default" : log.action === "DELETE" ? "destructive" : "secondary"} className="text-[9px] font-bold">
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">
                                        {log.entity}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                                        {log.details}
                                    </TableCell>
                                    <TableCell className="text-right text-[10px] text-muted-foreground">
                                        {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {logs.length === 0 && (
                        <div className="p-12 text-center text-muted-foreground">
                            No activity logs found.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
