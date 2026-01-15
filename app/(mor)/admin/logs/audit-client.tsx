"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Download } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import * as XLSX from "xlsx"

interface AuditLog {
    id: string
    action: string
    entity: string
    entityId: string | null
    details: string | null
    createdAt: Date
    user: {
        name: string
        email: string
        role: string
    }
}

interface AuditClientProps {
    initialLogs: AuditLog[]
}

export function AuditClient({ initialLogs }: AuditClientProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [actionFilter, setActionFilter] = useState("ALL")
    const [entityFilter, setEntityFilter] = useState("ALL")

    const filteredLogs = initialLogs.filter(log => {
        const matchesSearch =
            log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.entity.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesAction = actionFilter === "ALL" || log.action === actionFilter
        const matchesEntity = entityFilter === "ALL" || log.entity === entityFilter

        return matchesSearch && matchesAction && matchesEntity
    })

    const uniqueActions = Array.from(new Set(initialLogs.map(l => l.action)))
    const uniqueEntities = Array.from(new Set(initialLogs.map(l => l.entity)))

    const handleExport = () => {
        const data = filteredLogs.map(log => ({
            Date: format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
            User: log.user.name,
            Role: log.user.role,
            Action: log.action,
            Entity: log.entity,
            Details: log.details
        }))

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Audit Logs")
        XLSX.writeFile(wb, `audit-logs-${format(new Date(), "yyyy-MM-dd")}.xlsx`)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search logs..."
                            className="pl-9 bg-background/50 border-border/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Filter Action" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Actions</SelectItem>
                            {uniqueActions.map(a => (
                                <SelectItem key={a} value={a}>{a}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={entityFilter} onValueChange={setEntityFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Filter Entity" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Entities</SelectItem>
                            {uniqueEntities.map(e => (
                                <SelectItem key={e} value={e}>{e}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button variant="outline" onClick={handleExport} className="gap-2">
                    <Download className="h-4 w-4" /> Export CSV
                </Button>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/50 bg-muted/20">
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Timestamp</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">User</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Action</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Entity</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.map((log) => (
                                <TableRow key={log.id} className="border-border/50 hover:bg-primary/5 transition-colors">
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                                    </TableCell>
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
                                    <TableCell className="text-xs text-muted-foreground">
                                        {log.details}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {filteredLogs.length === 0 && (
                        <div className="p-12 text-center text-muted-foreground">
                            No logs found matching your filters.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
