"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, getDay } from "date-fns"
import { Calendar as CalendarIcon, Check, X, Save, Loader2, Users, TrendingUp, UserCheck, Download, Plus, Search as SearchIcon, MoreHorizontal, Upload, QrCode } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { EventType } from "@prisma/client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BulkImportDialog } from "@/components/shared/bulk-import-dialog"
import { saveAttendanceAction, bulkSaveAttendanceAction } from "./actions"

interface Member {
    id: string
    name: string
    status: string
    phoneNumber?: string
    groupId: string
    group?: { id: string, name: string }
    _count?: { attendance: number }
}

interface Group {
    id: string
    name: string
    members: Member[]
}

interface AttendanceClientProps {
    initialGroups: Group[]
    allMembers: Member[]
    cbsLocations: { id: string, name: string }[]
    userRole: string
}

export function AttendanceClient({ initialGroups, allMembers, cbsLocations, userRole }: AttendanceClientProps) {
    const router = useRouter()
    const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroups[0]?.id || "")
    const [selectedLocationId, setSelectedLocationId] = useState<string>(cbsLocations[0]?.id || "")
    const [date, setDate] = useState<Date>(new Date())
    const [eventType, setEventType] = useState<EventType>(EventType.SATURDAY_FELLOWSHIP)
    const [notes, setNotes] = useState("")
    const [attendance, setAttendance] = useState<Record<string, boolean>>({})
    const [isSaving, setIsSaving] = useState(false)
    const [selectedMember, setSelectedMember] = useState<Member | null>(null)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
    const [isAddAttendanceOpen, setIsAddAttendanceOpen] = useState(false)
    const [memberSearchTerm, setMemberSearchTerm] = useState("")
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
    const [isSessionActive, setIsSessionActive] = useState(false)

    const handleDateChange = (newDate: Date | undefined) => {
        if (!newDate) return
        setDate(newDate)

        const day = getDay(newDate)
        // 0: Sunday, 1: Monday, 2: Tuesday, 3: Wednesday, 4: Thursday, 5: Friday, 6: Saturday
        if (day === 2) {
            setEventType(EventType.CBS)
        } else if (day === 6) {
            setEventType(EventType.SATURDAY_FELLOWSHIP)
        } else if (day === 0 || day === 4) {
            setEventType(EventType.LEADERSHIP_MEETING)
        }
    }

    const handleBulkImportAttendance = async (data: any[]) => {
        // Group data by Date, EventType, and GroupName
        const sessionsMap: Record<string, any> = {}

        data.forEach(row => {
            const dateStr = row.Date?.toString()
            const typeStr = row.EventType?.toString().toUpperCase()
            const groupName = row.GroupName?.toString()
            const memberName = row.MemberName?.toString()
            const phone = row.Phone?.toString()
            const isPresent = row.IsPresent?.toString().toLowerCase() === "true" || row.IsPresent === 1 || row.IsPresent === "yes"

            if (!dateStr || !typeStr || !groupName || !memberName) return

            const key = `${dateStr}_${typeStr}_${groupName}`
            if (!sessionsMap[key]) {
                const group = initialGroups.find(g => g.name.toLowerCase() === groupName.toLowerCase())
                if (!group) throw new Error(`Group "${groupName}" not found`)

                sessionsMap[key] = {
                    groupId: group.id,
                    type: typeStr as EventType,
                    date: new Date(dateStr),
                    records: []
                }
            }

            const member = allMembers.find(m =>
                m.name.toLowerCase() === memberName.toLowerCase() &&
                (!phone || m.phoneNumber === phone)
            )

            if (member) {
                sessionsMap[key].records.push({
                    memberId: member.id,
                    isPresent
                })
            }
        })

        const sessionsToSave = Object.values(sessionsMap)
        if (sessionsToSave.length === 0) throw new Error("No valid attendance records found in file")

        return await bulkSaveAttendanceAction(sessionsToSave)
    }

    const selectedGroup = initialGroups.find(g => g.id === selectedGroupId)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            if (!isSessionActive) {
                toast.error("Please confirm session details first")
                return
            }

            // If the modal is open, we might have attendance for any member
            // Otherwise, we default to the selected group's members
            const memberIdsToSave = isAddAttendanceOpen
                ? Object.keys(attendance)
                : selectedGroup?.members.map(m => m.id) || []

            if (memberIdsToSave.length === 0) {
                toast.error("No attendance records to save. Please mark at least one member.")
                return
            }

            const records = memberIdsToSave.map(id => ({
                memberId: id,
                isPresent: !!attendance[id]
            }))

            await saveAttendanceAction({
                groupId: eventType === EventType.CBS ? undefined : selectedGroupId,
                cbsLocationId: eventType === EventType.CBS ? selectedLocationId : undefined,
                type: eventType,
                date,
                records,
                notes: notes || undefined
            })
            toast.success("Attendance saved successfully")
            setAttendance({})
            setNotes("")
            setIsSessionActive(false)
            if (isAddAttendanceOpen) setIsAddAttendanceOpen(false)
            router.refresh()
        } catch (error) {
            toast.error("Failed to save attendance")
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const exportToCSV = () => {
        const data = allMembers.map(m => ({
            Name: m.name,
            Group: m.group?.name || "N/A",
            Status: m.status,
            AttendanceCount: m._count?.attendance || 0
        }))
        const headers = ["Name", "Group", "Status", "AttendanceCount"]
        const csvContent = [
            headers.join(","),
            ...data.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.setAttribute("download", `attendance_${format(new Date(), "yyyy-MM-dd")}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const exportToExcel = () => {
        const data = allMembers.map(m => ({
            Name: m.name,
            Group: m.group?.name || "N/A",
            Status: m.status,
            AttendanceCount: m._count?.attendance || 0
        }))
        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance")
        XLSX.writeFile(workbook, `attendance_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
    }

    const exportToPDF = () => {
        const doc = new jsPDF()
        doc.text("Attendance Report", 14, 15)
        const tableData = allMembers.map(m => [
            m.name,
            m.group?.name || "N/A",
            m.status,
            (m._count?.attendance || 0).toString()
        ])
            ; (doc as any).autoTable({
                head: [["Name", "Group", "Status", "Attendance Count"]],
                body: tableData,
                startY: 20,
            })
        doc.save(`attendance_${format(new Date(), "yyyy-MM-dd")}.pdf`)
    }

    const filteredAllMembers = allMembers
        .filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(memberSearchTerm.toLowerCase())
            const matchesGroup = eventType === EventType.CBS ? true : m.groupId === selectedGroupId
            return matchesSearch && matchesGroup
        })
        .sort((a, b) => (b._count?.attendance || 0) - (a._count?.attendance || 0))

    const totalMembers = allMembers.length
    const establishedMembers = allMembers.filter(m => m.status === "ESTABLISHED").length
    const avgAttendance = allMembers.length > 0
        ? (allMembers.reduce((acc, m) => acc + (m._count?.attendance || 0), 0) / allMembers.length).toFixed(1)
        : 0

    return (
        <>
            <div className="grid gap-6">
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
                            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Avg. Attendance</p>
                                <h3 className="text-2xl font-bold">{avgAttendance}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Download className="h-4 w-4" /> Export Attendance
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={exportToPDF}>Export as PDF</DropdownMenuItem>
                                <DropdownMenuItem onClick={exportToCSV}>Export as CSV</DropdownMenuItem>
                                <DropdownMenuItem onClick={exportToExcel}>Export as Excel</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => router.push("/attendance/qr")}
                        >
                            <QrCode className="h-4 w-4" />
                            QR Check-in
                        </Button>

                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => setIsImportDialogOpen(true)}
                        >
                            <Upload className="h-4 w-4" />
                            Bulk Import
                        </Button>

                        <Dialog open={isAddAttendanceOpen} onOpenChange={setIsAddAttendanceOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 shadow-lg shadow-primary/20">
                                    <Plus className="h-4 w-4" /> Add Attendance
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 overflow-hidden">
                                <DialogHeader className="p-6 border-b">
                                    <DialogTitle>Mark Attendance</DialogTitle>
                                    <div className="flex flex-col gap-4 mt-4">
                                        <div className="relative">
                                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search members..."
                                                className="pl-9"
                                                value={memberSearchTerm}
                                                onChange={(e) => setMemberSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs h-8 bg-green-500/5 hover:bg-green-500/10 text-green-600 border-green-500/20"
                                                onClick={() => {
                                                    const newAttendance = { ...attendance }
                                                    filteredAllMembers.forEach(m => newAttendance[m.id] = true)
                                                    setAttendance(newAttendance)
                                                }}
                                            >
                                                Mark All Present
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs h-8 bg-red-500/5 hover:bg-red-500/10 text-red-600 border-red-500/20"
                                                onClick={() => {
                                                    const newAttendance = { ...attendance }
                                                    filteredAllMembers.forEach(m => newAttendance[m.id] = false)
                                                    setAttendance(newAttendance)
                                                }}
                                            >
                                                Mark All Absent
                                            </Button>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <div className="flex-1 overflow-y-auto p-6 relative">
                                    {!isSessionActive && (
                                        <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                                            <div className="bg-card border border-border/50 p-6 rounded-2xl shadow-xl max-w-xs">
                                                <Calendar className="h-12 w-12 text-primary mx-auto mb-4 opacity-50" />
                                                <h3 className="font-bold text-lg mb-2">Session Not Started</h3>
                                                <p className="text-sm text-muted-foreground mb-4">Please confirm the session details (Group, Date, Type) first.</p>
                                                <Button
                                                    onClick={() => {
                                                        const scrollTarget = document.getElementById('session-details-card')
                                                        if (scrollTarget) scrollTarget.scrollIntoView({ behavior: 'smooth' })
                                                        setIsAddAttendanceOpen(false)
                                                    }}
                                                    variant="secondary"
                                                    className="w-full"
                                                >
                                                    Set Details
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    <div className={cn("space-y-4", !isSessionActive && "opacity-20 pointer-events-none")}>
                                        {filteredAllMembers.map(member => (
                                            <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                                                <div>
                                                    <p className="font-semibold">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground">{member.group?.name || "No Group"}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right mr-4">
                                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Attendance</p>
                                                        <p className="text-sm font-bold text-primary">{member._count?.attendance || 0}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-full border border-border/50">
                                                        <button
                                                            onClick={() => setAttendance(prev => ({ ...prev, [member.id]: true }))}
                                                            className={cn(
                                                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all",
                                                                attendance[member.id] ? "bg-green-500 text-white" : "text-muted-foreground"
                                                            )}
                                                        >
                                                            PR
                                                        </button>
                                                        <button
                                                            onClick={() => setAttendance(prev => ({ ...prev, [member.id]: false }))}
                                                            className={cn(
                                                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all",
                                                                attendance[member.id] === false ? "bg-red-500 text-white" : "text-muted-foreground"
                                                            )}
                                                        >
                                                            AB
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <DialogFooter className="p-6 border-t bg-muted/20">
                                    <Button variant="outline" onClick={() => setIsAddAttendanceOpen(false)}>Cancel</Button>
                                    <Button onClick={() => {
                                        handleSave()
                                        setIsAddAttendanceOpen(false)
                                    }}>Save All</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <Card id="session-details-card" className={cn(
                    "border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300",
                    isSessionActive ? "ring-2 ring-primary/20 border-primary/30" : "opacity-100"
                )}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-medium">Session Details</CardTitle>
                        {!isSessionActive ? (
                            <Button
                                size="sm"
                                className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                onClick={() => setIsSessionActive(true)}
                            >
                                <Check className="h-4 w-4" /> Confirm & Start Marking
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={() => setIsSessionActive(false)}
                            >
                                <X className="h-4 w-4" /> Change Details
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className={cn("flex flex-wrap gap-4", isSessionActive && "pointer-events-none opacity-70")}>
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                {eventType === EventType.CBS ? "CBS Location" : "Ministry Group"}
                            </label>
                            {eventType === EventType.CBS ? (
                                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                                    <SelectTrigger className="bg-background/50 border-border/50">
                                        <SelectValue placeholder="Select a location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cbsLocations.map(loc => (
                                            <SelectItem key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                                    <SelectTrigger className="bg-background/50 border-border/50">
                                        <SelectValue placeholder="Select a group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {initialGroups.map(group => (
                                            <SelectItem key={group.id} value={group.id}>
                                                {group.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                Fellowship Date
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-background/50 border-border/50",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={handleDateChange}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                Event Type
                            </label>
                            <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                                <SelectTrigger className="bg-background/50 border-border/50">
                                    <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(EventType).map(type => (
                                        <SelectItem key={type} value={type}>
                                            {type.replace(/_/g, ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                Session Notes (Optional)
                            </label>
                            <Input
                                placeholder="Add any specific notes for this session..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="bg-background/50 border-border/50"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/20 px-4 md:px-6 py-4 sticky top-0 z-10 backdrop-blur-md">
                        <div>
                            <CardTitle className="text-base md:text-lg font-medium">
                                Overall Attendance Summary
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">Cumulative attendance across all sessions</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/10">
                                    <TableRow className="border-border/50">
                                        <TableHead className="font-bold uppercase tracking-wider text-[10px]">Member Name</TableHead>
                                        <TableHead className="font-bold uppercase tracking-wider text-[10px]">Ministry Group</TableHead>
                                        <TableHead className="font-bold uppercase tracking-wider text-[10px]">Status</TableHead>
                                        <TableHead className="font-bold uppercase tracking-wider text-[10px] text-center">Total Attendance</TableHead>
                                        <TableHead className="font-bold uppercase tracking-wider text-[10px] text-right">Progress</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAllMembers.map((member) => (
                                        <TableRow
                                            key={member.id}
                                            className="hover:bg-primary/5 transition-colors border-border/50 cursor-pointer"
                                            onClick={() => {
                                                setSelectedMember(member)
                                                setIsDetailDialogOpen(true)
                                            }}
                                        >
                                            <TableCell>
                                                <div className="font-semibold text-sm text-foreground">{member.name}</div>
                                                {member.phoneNumber && <div className="text-[10px] text-muted-foreground">{member.phoneNumber}</div>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-muted/50 font-medium text-[10px]">
                                                    {member.group?.name || "No Group"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "uppercase font-bold text-[9px]",
                                                    member.status === "ESTABLISHED" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                        member.status === "SEMI_CONSISTENT" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                            "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                                )}>
                                                    {member.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-primary">
                                                {member._count?.attendance || 0}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary transition-all"
                                                            style={{ width: `${Math.min(((member._count?.attendance || 0) / 12) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-medium text-muted-foreground">
                                                        {Math.round(((member._count?.attendance || 0) / 12) * 100)}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {filteredAllMembers.length === 0 && (
                            <div className="p-12 text-center text-muted-foreground">
                                No members found matching your search.
                            </div>
                        )}
                    </CardContent>
                </Card>

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
                                        <p className="text-sm text-muted-foreground">Ministry Member</p>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Quick Actions</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            <Button variant="outline" className="justify-start gap-3 h-12 rounded-2xl border-border/50 hover:bg-primary/5">
                                                <Calendar className="h-4 w-4 text-primary" />
                                                View Full History
                                            </Button>
                                            <Button variant="outline" className="justify-start gap-3 h-12 rounded-2xl border-border/50 hover:bg-primary/5">
                                                <Save className="h-4 w-4 text-green-500" />
                                                Edit Member Profile
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
            </div>

            <BulkImportDialog
                isOpen={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                title="Import Attendance"
                description="Upload a CSV or Excel file with attendance records. MemberName and GroupName must match existing records."
                templateHeaders={["MemberName", "Phone", "Date", "EventType", "IsPresent", "GroupName"]}
                sampleData={[
                    {
                        MemberName: "John Doe",
                        Phone: "08012345678",
                        Date: format(new Date(), "yyyy-MM-dd"),
                        EventType: "SATURDAY_FELLOWSHIP",
                        IsPresent: "Yes",
                        GroupName: initialGroups[0]?.name || "Group A"
                    }
                ]}
                onImport={handleBulkImportAttendance}
            />
        </>
    )
}
