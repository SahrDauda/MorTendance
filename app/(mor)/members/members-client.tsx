"use client"

import { useState } from "react"
import { Search, MoreHorizontal, UserPlus, Calendar, Users, UserCheck, TrendingUp, Download, LayoutGrid, List, Building2, Shield } from "lucide-react"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { addMemberAction } from "./actions"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Member {
    id: string
    name: string
    phoneNumber?: string
    status: string
    group: {
        id: string
        name: string
    }
    branch?: {
        id: string
        name: string
    } | null
    _count: {
        attendance: number
    }
}

interface Group {
    id: string
    name: string
    leader?: {
        id: string
        name: string
    } | null
    branch?: {
        id: string
        name: string
    } | null
    _count?: {
        members: number
    }
}

interface Branch {
    id: string
    name: string
}

interface MembersClientProps {
    initialMembers: Member[]
    groups: Group[]
    branches: Branch[]
    userRole?: string
}

export function MembersClient({ initialMembers, groups, branches, userRole = "PROBATION_LEADER" }: MembersClientProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedGroup, setSelectedGroup] = useState("all")
    const [selectedBranch, setSelectedBranch] = useState("all")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [selectedMember, setSelectedMember] = useState<Member | null>(null)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
    const [viewMode, setViewMode] = useState<"list" | "groups">("list")

    const [newMemberName, setNewMemberName] = useState("")
    const [newMemberPhone, setNewMemberPhone] = useState("")
    const [newMemberGroupId, setNewMemberGroupId] = useState(groups[0]?.id || "")
    const [newMemberBranchId, setNewMemberBranchId] = useState<string>("none")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const filteredMembers = initialMembers.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesGroup = selectedGroup === "all" || member.group.id === selectedGroup
        const matchesBranch = selectedBranch === "all" || member.branch?.id === selectedBranch
        return matchesSearch && matchesGroup && matchesBranch
    })

    const handleAddMember = async () => {
        if (!newMemberName || !newMemberGroupId) {
            toast.error("Please fill in all fields")
            return
        }

        setIsSubmitting(true)
        try {
            await addMemberAction({
                name: newMemberName,
                phoneNumber: newMemberPhone || undefined,
                groupId: newMemberGroupId,
                branchId: newMemberBranchId === "none" ? undefined : newMemberBranchId
            })
            toast.success("Member added successfully")
            setIsAddDialogOpen(false)
            setNewMemberName("")
            setNewMemberPhone("")
            setNewMemberGroupId(groups[0]?.id || "")
            setNewMemberBranchId("none")
            setTimeout(() => window.location.reload(), 500)
        } catch (error) {
            toast.error("Failed to add member")
        } finally {
            setIsSubmitting(false)
        }
    }

    const openMemberDetail = (member: Member) => {
        setSelectedMember(member)
        setIsDetailDialogOpen(true)
    }

    const exportToCSV = () => {
        const data = initialMembers.map(m => ({
            Name: m.name,
            Phone: m.phoneNumber || "N/A",
            Group: m.group.name,
            Status: m.status,
            AttendanceCount: m._count.attendance
        }))
        const headers = ["Name", "Phone", "Group", "Status", "AttendanceCount"]
        const csvContent = [
            headers.join(","),
            ...data.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.setAttribute("download", `members_${format(new Date(), "yyyy-MM-dd")}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const exportToExcel = () => {
        const data = initialMembers.map(m => ({
            Name: m.name,
            Phone: m.phoneNumber || "N/A",
            Group: m.group.name,
            Status: m.status,
            AttendanceCount: m._count.attendance
        }))
        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Members")
        XLSX.writeFile(workbook, `members_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
    }

    const exportToPDF = () => {
        const doc = new jsPDF()
        doc.text("MOR Members Report", 14, 15)
        const tableData = initialMembers.map(m => [
            m.name,
            m.phoneNumber || "N/A",
            m.group.name,
            m.status,
            m._count.attendance.toString()
        ])
            ; (doc as any).autoTable({
                head: [["Name", "Phone", "Group", "Status", "Attendance"]],
                body: tableData,
                startY: 20,
            })
        doc.save(`members_${format(new Date(), "yyyy-MM-dd")}.pdf`)
    }

    const totalMembers = initialMembers.length
    const establishedMembers = initialMembers.filter(m => m.status === "ESTABLISHED").length
    const newMembers = initialMembers.filter(m => m.status === "PRELIMINARY").length

    return (
        <>
            <Tabs defaultValue="members" className="space-y-6">
                <div className="flex items-center justify-between">
                    <TabsList className="bg-muted/50 border border-border/50 p-1 rounded-xl">
                        <TabsTrigger value="members" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Members</TabsTrigger>
                        <TabsTrigger value="groups" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Groups</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="members" className="space-y-6 mt-0">
                    <div className="space-y-6">
                        {/* Dashboard Highlights */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                                        <h3 className="text-2xl font-bold">{totalMembers}</h3>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                                        <UserCheck className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Established</p>
                                        <h3 className="text-2xl font-bold">{establishedMembers}</h3>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                        <TrendingUp className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">New Members</p>
                                        <h3 className="text-2xl font-bold">{newMembers}</h3>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" onClick={exportToPDF} className="gap-2">
                                    <Download className="h-4 w-4" /> PDF
                                </Button>
                                <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
                                    <Download className="h-4 w-4" /> CSV
                                </Button>
                                <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-2">
                                    <Download className="h-4 w-4" /> Excel
                                </Button>
                                <div className="h-8 w-px bg-border mx-2 hidden md:block" />
                                <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
                                    <Button
                                        variant={viewMode === "list" ? "secondary" : "ghost"}
                                        size="sm"
                                        className="h-7 px-3 gap-2 rounded-md"
                                        onClick={() => setViewMode("list")}
                                    >
                                        <List className="h-3.5 w-3.5" /> List
                                    </Button>
                                    <Button
                                        variant={viewMode === "groups" ? "secondary" : "ghost"}
                                        size="sm"
                                        className="h-7 px-3 gap-2 rounded-md"
                                        onClick={() => setViewMode("groups")}
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" /> Groups
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-1 items-center gap-2 max-w-sm">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search members..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 bg-card/50 border-border/50"
                                    />
                                </div>
                                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                    <SelectTrigger className="w-[180px] bg-card/50 border-border/50">
                                        <SelectValue placeholder="Filter by branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Branches</SelectItem>
                                        {branches.map(branch => (
                                            <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                                    <SelectTrigger className="w-[180px] bg-card/50 border-border/50">
                                        <SelectValue placeholder="Filter by group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Groups</SelectItem>
                                        {groups.map(group => (
                                            <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2 shadow-lg shadow-primary/20">
                                        <UserPlus className="h-4 w-4" />
                                        Add New Member
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Add New Member</DialogTitle>
                                        <DialogDescription>
                                            Enter the details of the new member to add them to a fellowship group.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Full Name</label>
                                            <Input
                                                placeholder="John Doe"
                                                value={newMemberName}
                                                onChange={(e) => setNewMemberName(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Phone Number (Optional)</label>
                                            <Input
                                                placeholder="+234..."
                                                value={newMemberPhone}
                                                onChange={(e) => setNewMemberPhone(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Ministry Group</label>
                                            <Select value={newMemberGroupId} onValueChange={setNewMemberGroupId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select group" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {groups.map(group => (
                                                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Branch (Optional)</label>
                                            <Select value={newMemberBranchId} onValueChange={setNewMemberBranchId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select branch" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {branches.map(branch => (
                                                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleAddMember} disabled={isSubmitting}>
                                            {isSubmitting ? "Adding..." : "Add Member"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Desktop Table View */}
                        {viewMode === "list" ? (
                            <Card className="hidden md:block border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-muted/20">
                                            <TableRow>
                                                <TableHead className="font-bold uppercase tracking-wider">Member Name</TableHead>
                                                <TableHead className="font-bold uppercase tracking-wider">Branch</TableHead>
                                                <TableHead className="font-bold uppercase tracking-wider">Group</TableHead>
                                                <TableHead className="font-bold uppercase tracking-wider">Status</TableHead>
                                                <TableHead className="font-bold uppercase tracking-wider">Attendances</TableHead>
                                                <TableHead className="font-bold uppercase tracking-wider text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredMembers.map((member) => (
                                                <TableRow
                                                    key={member.id}
                                                    className="hover:bg-primary/5 transition-colors border-border/50 cursor-pointer"
                                                    onClick={() => openMemberDetail(member)}
                                                >
                                                    <TableCell>
                                                        <div className="font-semibold text-foreground">{member.name}</div>
                                                        {member.phoneNumber && <div className="text-[10px] text-muted-foreground">{member.phoneNumber}</div>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-medium">
                                                            {member.branch?.name || "No Branch"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="bg-muted/50 font-medium">
                                                            {member.group.name}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={cn(
                                                            "uppercase font-bold text-[10px]",
                                                            member.status === "ESTABLISHED" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                                member.status === "SEMI_CONSISTENT" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                                    "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                                        )}>
                                                            {member.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary transition-all"
                                                                    style={{ width: `${Math.min((member._count.attendance / 3) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                {member._count.attendance}/3
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {groups.map(group => {
                                    const groupMembers = filteredMembers.filter(m => m.group.id === group.id)
                                    if (groupMembers.length === 0 && selectedGroup !== "all") return null
                                    if (groupMembers.length === 0 && selectedGroup === "all") return null // Hide empty groups in group view unless filtered? Actually better to show them if they exist

                                    return (
                                        <Card key={group.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                        <Users className="h-5 w-5 text-primary" />
                                                        {group.name}
                                                    </CardTitle>
                                                    <Badge variant="secondary">{groupMembers.length}</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    {groupMembers.slice(0, 5).map(member => (
                                                        <div
                                                            key={member.id}
                                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/5 cursor-pointer transition-colors"
                                                            onClick={() => openMemberDetail(member)}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{member.name}</span>
                                                                <span className="text-[10px] text-muted-foreground">{member.status}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-primary"
                                                                        style={{ width: `${Math.min((member._count.attendance / 3) * 100, 100)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {groupMembers.length > 5 && (
                                                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => {
                                                            setSelectedGroup(group.id)
                                                            setViewMode("list")
                                                        }}>
                                                            View {groupMembers.length - 5} more...
                                                        </Button>
                                                    )}
                                                    {groupMembers.length === 0 && (
                                                        <div className="text-center py-8 text-muted-foreground text-sm italic">
                                                            No members in this group
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}

                        {/* Mobile Card View */}
                        {viewMode === "list" && (
                            <div className="grid gap-4 md:hidden">
                                {filteredMembers.map((member) => (
                                    <Card
                                        key={member.id}
                                        className="border-border/50 bg-card/50 backdrop-blur-sm cursor-pointer active:scale-[0.98] transition-transform"
                                        onClick={() => openMemberDetail(member)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-foreground">{member.name}</h3>
                                                    {member.phoneNumber && <p className="text-[10px] text-muted-foreground">{member.phoneNumber}</p>}
                                                    <div className="flex gap-2">
                                                        <Badge variant="secondary" className="text-[10px] h-5">
                                                            {member.group.name}
                                                        </Badge>
                                                        <Badge className={cn(
                                                            "uppercase font-bold text-[9px] h-5",
                                                            member.status === "ESTABLISHED" ? "bg-green-500/10 text-green-500" :
                                                                member.status === "SEMI_CONSISTENT" ? "bg-amber-500/10 text-amber-500" :
                                                                    "bg-blue-500/10 text-blue-500"
                                                        )}>
                                                            {member.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase">
                                                    <span>Attendance Progress</span>
                                                    <span>{member._count.attendance}/3</span>
                                                </div>
                                                <Progress value={(member._count.attendance / 3) * 100} className="h-1.5" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {filteredMembers.length === 0 && (
                            <div className="p-12 text-center text-muted-foreground bg-card/50 rounded-2xl border border-dashed border-border/50">
                                No members found matching your search.
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="groups" className="space-y-6 mt-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Ministry Groups</h2>
                            <p className="text-muted-foreground">Manage fellowship groups, assign leaders and branches.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map(group => (
                            <Card key={group.id} className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden group">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Users className="h-4 w-4 text-primary" />
                                            </div>
                                            {group.name}
                                        </CardTitle>
                                        <Badge variant="secondary" className="font-bold">
                                            {group._count?.members || 0} Members
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Leader:</span>
                                            <span className="font-medium">{group.leader?.name || "No Leader Assigned"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Branch:</span>
                                            <span className="font-medium">{group.branch?.name || "No Branch Assigned"}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex items-center gap-2 border-t border-border/50">
                                        <Button variant="outline" size="sm" className="flex-1 h-9 rounded-xl border-border/50 hover:bg-primary/5">
                                            Edit Group
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/5">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Member Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none bg-transparent">
                    {selectedMember && (
                        <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6">
                                <div className="absolute top-6 right-6">
                                    <Badge className={cn(
                                        "uppercase font-bold text-[10px] px-3 py-1",
                                        selectedMember.status === "ESTABLISHED" ? "bg-green-500 text-white" :
                                            selectedMember.status === "SEMI_CONSISTENT" ? "bg-amber-500 text-white" :
                                                "bg-blue-500 text-white"
                                    )}>
                                        {selectedMember.status}
                                    </Badge>
                                </div>
                                <div className="mt-8">
                                    <h2 className="text-2xl font-bold text-foreground">{selectedMember.name}</h2>
                                    <p className="text-sm text-muted-foreground">{selectedMember.group.name} Fellowship</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Phone Number</p>
                                        <p className="text-sm font-medium">{selectedMember.phoneNumber || "Not provided"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Attendance Rate</p>
                                        <p className="text-sm font-medium">{Math.round((selectedMember._count.attendance / 3) * 100)}% Consistency</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Actions</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        <Button variant="outline" className="justify-start gap-3 h-12 rounded-2xl border-border/50 hover:bg-primary/5">
                                            <Calendar className="h-4 w-4 text-primary" />
                                            View Attendance History
                                        </Button>
                                        <Button variant="outline" className="justify-start gap-3 h-12 rounded-2xl border-border/50 hover:bg-primary/5">
                                            <UserPlus className="h-4 w-4 text-green-500" />
                                            Edit Member Details
                                        </Button>
                                        <Button variant="ghost" className="justify-start gap-3 h-12 rounded-2xl text-destructive hover:bg-destructive/5 hover:text-destructive">
                                            <MoreHorizontal className="h-4 w-4" />
                                            Delete Member
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-muted/30 border-t border-border/50 flex justify-end">
                                <Button variant="secondary" onClick={() => setIsDetailDialogOpen(false)} className="rounded-xl">
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
