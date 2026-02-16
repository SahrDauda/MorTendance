"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, getDay } from "date-fns"
import { Calendar as CalendarIcon, Check, X, Save, Loader2, Users, TrendingUp, UserCheck, Download, Plus, Search as SearchIcon, MoreHorizontal, Upload, QrCode, Copy, Printer, CheckCircle2, Trash2 } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { saveAttendanceAction, bulkSaveAttendanceAction, cleanupDuplicateAttendanceAction, deleteAttendanceRecordAction, deleteAttendanceSessionAction } from "./actions"
import { useLocalStorage } from "@/hooks/use-local-storage"

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

interface Leader {
    id: string
    name: string
    email: string
    role: string
}

interface AttendanceSession {
    id: string
    date: Date
    type: string
    notes?: string
    cutoffTime?: string
    group?: { id: string, name: string }
    recorder: { name: string }
    records: Array<{
        id: string
        memberId: string
        isPresent: boolean
        isLate: boolean
        member: {
            id: string
            name: string
            phoneNumber?: string
            status: string
            group?: { id: string, name: string }
        }
    }>
}

interface AttendanceClientProps {
    initialGroups: Group[]
    allMembers: Member[]
    cbsLocations: { id: string, name: string }[]
    leaders: Leader[]
    recentSessions?: AttendanceSession[]
    userRole: string
    todaysSaturdayGroupIds?: string[]
    branches?: { id: string, name: string }[]
}

interface SessionState {
    isActive: boolean
    date: string
    eventType: EventType
    groupId?: string
    locationId?: string
    cutoffTime?: string
    notes?: string
    attendance: Record<string, { isPresent: boolean; isLate?: boolean }>
}

export function AttendanceClient({ initialGroups, allMembers, cbsLocations, leaders, recentSessions = [], userRole, todaysSaturdayGroupIds = [], branches = [] }: AttendanceClientProps) {
    const router = useRouter()
    const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroups[0]?.id || "")
    const [selectedLocationId, setSelectedLocationId] = useState<string>(cbsLocations[0]?.id || "")
    const [date, setDate] = useState<Date>(new Date())
    const [eventType, setEventType] = useState<EventType>(EventType.SATURDAY_FELLOWSHIP)
    const [notes, setNotes] = useState("")
    const [cutoffTime, setCutoffTime] = useState("09:00") // Default 9:00 AM
    const [attendance, setAttendance] = useState<Record<string, { isPresent: boolean; isLate?: boolean }>>({})
    const [isSaving, setIsSaving] = useState(false)
    const [selectedMember, setSelectedMember] = useState<Member | null>(null)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
    const [isAddAttendanceOpen, setIsAddAttendanceOpen] = useState(false)
    const [memberSearchTerm, setMemberSearchTerm] = useState("")
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
    const [isQRModalOpen, setIsQRModalOpen] = useState(false)
    const [selectedBranchForQR, setSelectedBranchForQR] = useState<string>(branches[0]?.id || "")
    const [qrCopied, setQrCopied] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)
    const [deleteRecordDialog, setDeleteRecordDialog] = useState<{ open: boolean; recordId: string | null; memberName: string }>({ open: false, recordId: null, memberName: "" })
    const [deleteSessionDialog, setDeleteSessionDialog] = useState<{ open: boolean; sessionId: string | null; sessionName: string }>({ open: false, sessionId: null, sessionName: "" })
    const [isDeleting, setIsDeleting] = useState(false)

    // Use localStorage to persist session state
    const [sessionState, setSessionState] = useLocalStorage<SessionState | null>("attendance_session", null)
    const [isSessionActive, setIsSessionActive] = useState(false)

    // Track explicitly completed groups (groups where user clicked "Complete Attendance")
    // Key: date string, Value: Set of completed group IDs for that date
    const [completedGroupsByDate, setCompletedGroupsByDate] = useLocalStorage<Record<string, string[]>>("completed_groups_by_date", {})
    
    // Get today's date key
    const todayKey = date.toISOString().split('T')[0]
    const todaysCompletedGroupIds = completedGroupsByDate[todayKey] || []
    const todaysCompletedSet = new Set(todaysCompletedGroupIds)

    // Pre-compute today's Saturday Fellowship completion across groups (for overview strip)
    const totalGroups = initialGroups.length
    const completedGroups = initialGroups.filter(g => todaysCompletedSet.has(g.id))
    const pendingGroups = initialGroups.filter(g => !todaysCompletedSet.has(g.id))

    useEffect(() => {
        setMounted(true)
        
        // Restore session state from localStorage FIRST (before setting defaults)
        if (sessionState) {
            const sessionDate = new Date(sessionState.date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            sessionDate.setHours(0, 0, 0, 0)

            // Only restore if it's the same day and was active
            if (sessionDate.getTime() === today.getTime() && sessionState.isActive) {
                setIsSessionActive(true)
                setDate(sessionDate)
                setEventType(sessionState.eventType)
                if (sessionState.groupId) setSelectedGroupId(sessionState.groupId)
                if (sessionState.locationId) setSelectedLocationId(sessionState.locationId)
                if (sessionState.cutoffTime) setCutoffTime(sessionState.cutoffTime)
                if (sessionState.notes) setNotes(sessionState.notes)
                // Restore all marked attendance
                if (sessionState.attendance && Object.keys(sessionState.attendance).length > 0) {
                    setAttendance(sessionState.attendance)
                    const markedCount = Object.keys(sessionState.attendance).filter(id => sessionState.attendance[id]?.isPresent).length
                    toast.info(`Session restored: ${markedCount} member(s) already marked present`)
                } else {
                    toast.info("Session restored - you can continue marking attendance")
                }
                return // Don't override with day-based defaults if we restored a session
            } else {
                // Clear expired session
                setSessionState(null)
            }
        }

        // Only set day-based defaults if no session was restored
        const today = new Date()
        const day = getDay(today)
        if (day === 2) {
            setEventType(EventType.CBS)
        } else if (day === 6) {
            setEventType(EventType.SATURDAY_FELLOWSHIP)
        } else if (day === 0 || day === 4) {
            setEventType(EventType.LEADERSHIP_MEETING)
        }
    }, [])

    // Check if day has passed and auto-close session + clean up old completed groups
    useEffect(() => {
        if (!mounted) return

        const checkDayChange = () => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const todayKey = today.toISOString().split('T')[0]
            
            // Clean up completed groups from previous days (keep only today and future dates)
            const cleanedCompletedGroups: Record<string, string[]> = {}
            Object.keys(completedGroupsByDate).forEach(dateKey => {
                if (dateKey >= todayKey) {
                    cleanedCompletedGroups[dateKey] = completedGroupsByDate[dateKey]
                }
            })
            if (Object.keys(cleanedCompletedGroups).length !== Object.keys(completedGroupsByDate).length) {
                setCompletedGroupsByDate(cleanedCompletedGroups)
            }

            if (isSessionActive) {
                const sessionDate = new Date(date)
                sessionDate.setHours(0, 0, 0, 0)

                if (sessionDate.getTime() !== today.getTime()) {
                    setIsSessionActive(false)
                    setAttendance({})
                    setNotes("")
                    setSessionState(null)
                    toast.info("Session closed automatically - new day started")
                }
            }
        }

        // Check immediately and then every minute
        checkDayChange()
        const interval = setInterval(checkDayChange, 60000) // Check every minute

        return () => clearInterval(interval)
    }, [isSessionActive, date, mounted, completedGroupsByDate])

    // Save session state to localStorage whenever it changes
    // This ensures the session persists even if user navigates away
    useEffect(() => {
        if (!mounted) return
        
        if (isSessionActive) {
            setSessionState({
                isActive: true,
                date: date.toISOString(),
                eventType,
                groupId: selectedGroupId,
                locationId: selectedLocationId,
                cutoffTime,
                notes,
                attendance
            })
        } else {
            // Only clear if explicitly closed (not just on mount)
            // This prevents clearing on initial load before we check for existing session
            if (mounted) {
                setSessionState(null)
            }
        }
    }, [isSessionActive, date, eventType, selectedGroupId, selectedLocationId, cutoffTime, notes, attendance, mounted])

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
            // Only save records that have been marked in the attendance state
            const memberIdsToSave = Object.keys(attendance).filter(id => attendance[id] !== undefined)

            if (memberIdsToSave.length === 0) {
                toast.error("No attendance records to save. Please mark at least one person.")
                setIsSaving(false)
                return
            }

            const records = memberIdsToSave.map(id => ({
                memberId: id,
                isPresent: attendance[id].isPresent,
                isLate: attendance[id].isLate || false
            }))

            await saveAttendanceAction({
                groupId: eventType === EventType.CBS || eventType === EventType.LEADERSHIP_MEETING ? undefined : selectedGroupId,
                cbsLocationId: eventType === EventType.CBS ? selectedLocationId : undefined,
                type: eventType,
                date,
                records,
                notes: notes || undefined,
                cutoffTime: cutoffTime
            })
            toast.success("Attendance saved successfully. You can continue adding members who arrived later.")
            // Keep session active - don't clear attendance so user can continue marking
            // Session persists until explicitly closed or day changes
            // Only clear notes after save
            // DO NOT mark group as complete - user must click "Complete Attendance" button
            setNotes("")
            if (isAddAttendanceOpen) setIsAddAttendanceOpen(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to save attendance")
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

    // Export single session to Excel in spreadsheet format
    const exportSessionToExcel = (session: AttendanceSession) => {
        const workbook = XLSX.utils.book_new()

        // Group members by status: Leaders, Intense (SEMI_CONSISTENT), Consistent (ESTABLISHED), Preliminary
        const leaders = session.records.filter(r => r.member.status.includes("LEADER") || r.member.status === "BRANCH_HEAD" || r.member.status === "COORDINATOR")
        const intense = session.records.filter(r => r.member.status === "SEMI_CONSISTENT")
        const consistent = session.records.filter(r => r.member.status === "ESTABLISHED")
        const preliminary = session.records.filter(r => r.member.status === "PRELIMINARY")

        // Create data array matching spreadsheet format
        const data: any[] = []

        // Headers
        data.push(["", "", "", "", "", "", ""]) // Empty row
        data.push(["", "", "", "", "", "", ""]) // Empty row

        // Month header (simplified - you can expand this for multiple months)
        const sessionDate = new Date(session.date)
        const monthName = format(sessionDate, "MMMM")
        data.push([monthName, "", "", "", "", "", ""])

        // Week headers
        const weekNum = Math.ceil(sessionDate.getDate() / 7)
        data.push(["", `Week ${weekNum}`, "", "", "Present", "Absent", "PA"])

        // Members section
        data.push(["Members"])
        data.push(["Leaders"])
        leaders.forEach(record => {
            const present = record.isPresent ? 1 : 0
            const absent = record.isPresent ? 0 : 1
            const pa = record.isPresent ? (record.isLate ? "LATE" : "100%") : "0%"
            data.push(["", record.member.name, record.member.phoneNumber || "", record.member.group?.name || "", present, absent, pa])
        })

        // Intense section
        data.push(["Intense"])
        intense.forEach(record => {
            const present = record.isPresent ? 1 : 0
            const absent = record.isPresent ? 0 : 1
            const pa = record.isPresent ? (record.isLate ? "LATE" : "100%") : "0%"
            data.push(["", record.member.name, record.member.phoneNumber || "", record.member.group?.name || "", present, absent, pa])
        })

        // Consistent section
        data.push(["Consistent"])
        consistent.forEach(record => {
            const present = record.isPresent ? 1 : 0
            const absent = record.isPresent ? 0 : 1
            const pa = record.isPresent ? (record.isLate ? "LATE" : "100%") : "0%"
            data.push(["", record.member.name, record.member.phoneNumber || "", record.member.group?.name || "", present, absent, pa])
        })

        const worksheet = XLSX.utils.aoa_to_sheet(data)
        XLSX.utils.book_append_sheet(workbook, worksheet, `${session.group?.name || "Attendance"}`)
        XLSX.writeFile(workbook, `attendance_${format(sessionDate, "yyyy-MM-dd")}_${session.group?.name || "session"}.xlsx`)
        toast.success("Session exported successfully")
    }

    // Export all sessions to Excel
    const exportAttendanceToExcel = (sessions: AttendanceSession[]) => {
        const workbook = XLSX.utils.book_new()

        sessions.forEach(session => {
            const sessionDate = new Date(session.date)
            const sheetName = `${format(sessionDate, "MMM-dd")}_${session.group?.name || "Session"}`.substring(0, 31) // Excel sheet name limit

            // Group members by status
            const leaders = session.records.filter(r => r.member.status.includes("LEADER") || r.member.status === "BRANCH_HEAD" || r.member.status === "COORDINATOR")
            const intense = session.records.filter(r => r.member.status === "SEMI_CONSISTENT")
            const consistent = session.records.filter(r => r.member.status === "ESTABLISHED")
            const preliminary = session.records.filter(r => r.member.status === "PRELIMINARY")

            const data: any[] = []
            data.push([`${session.group?.name || "Attendance"} - ${format(sessionDate, "MMMM d, yyyy")}`])
            data.push(["", "", "", "", "", "", ""])
            data.push(["", "Week", "", "", "Present", "Absent", "PA"])

            data.push(["Members"])
            data.push(["Leaders"])
            leaders.forEach(record => {
                const present = record.isPresent ? 1 : 0
                const absent = record.isPresent ? 0 : 1
                const pa = record.isPresent ? (record.isLate ? "LATE" : "100%") : "0%"
                data.push(["", record.member.name, record.member.phoneNumber || "", record.member.group?.name || "", present, absent, pa])
            })

            data.push(["Intense"])
            intense.forEach(record => {
                const present = record.isPresent ? 1 : 0
                const absent = record.isPresent ? 0 : 1
                const pa = record.isPresent ? (record.isLate ? "LATE" : "100%") : "0%"
                data.push(["", record.member.name, record.member.phoneNumber || "", record.member.group?.name || "", present, absent, pa])
            })

            data.push(["Consistent"])
            consistent.forEach(record => {
                const present = record.isPresent ? 1 : 0
                const absent = record.isPresent ? 0 : 1
                const pa = record.isPresent ? (record.isLate ? "LATE" : "100%") : "0%"
                data.push(["", record.member.name, record.member.phoneNumber || "", record.member.group?.name || "", present, absent, pa])
            })

            const worksheet = XLSX.utils.aoa_to_sheet(data)
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
        })

        XLSX.writeFile(workbook, `attendance_all_sessions_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
        toast.success("All sessions exported successfully")
    }

    // For Leadership Meeting, show leaders; otherwise show members
    const isLeadershipMeeting = eventType === EventType.LEADERSHIP_MEETING

    const filteredAllMembers = isLeadershipMeeting
        ? leaders
            .filter(leader => leader.name.toLowerCase().includes(memberSearchTerm.toLowerCase()))
            .map(leader => ({
                id: leader.id,
                name: leader.name,
                status: leader.role,
                phoneNumber: undefined,
                groupId: "",
                group: undefined,
                _count: { attendance: 0 }
            }))
        : allMembers
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

    const isAdminLikeRole = ["SUPER_ADMIN", "ADMIN", "BRANCH_HEAD", "COORDINATOR"].includes(userRole)
    const showSaturdayOverview = isAdminLikeRole && eventType === EventType.SATURDAY_FELLOWSHIP && totalGroups > 0

    return (
        <>
            <div className="grid gap-6">
                {showSaturdayOverview && (
                    <Card className="border-border/60 bg-primary/5 backdrop-blur-sm">
                        <CardContent className="p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">
                                    Today&apos;s Saturday Fellowship
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {completedGroups.length} of {totalGroups} groups marked as complete today.
                                </p>
                            </div>
                            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                                {pendingGroups.length > 0 && (
                                    <div className="flex-1">
                                        <p className="text-[11px] font-medium text-muted-foreground mb-1">
                                            Groups still to mark
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {pendingGroups.slice(0, 4).map(group => (
                                                <Button
                                                    key={group.id}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-[11px] px-2 rounded-full"
                                                    onClick={() => {
                                                        setSelectedGroupId(group.id)
                                                        setEventType(EventType.SATURDAY_FELLOWSHIP)
                                                        setIsAddAttendanceOpen(true)
                                                    }}
                                                >
                                                    {group.name}
                                                </Button>
                                            ))}
                                            {pendingGroups.length > 4 && (
                                                <span className="text-[11px] text-muted-foreground">
                                                    +{pendingGroups.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {completedGroups.length > 0 && (
                                    <div className="flex-1 md:w-auto">
                                        <p className="text-[11px] font-medium text-muted-foreground mb-1">
                                            Completed today
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {completedGroups.slice(0, 3).map(group => (
                                                <Badge
                                                    key={group.id}
                                                    variant="secondary"
                                                    className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 border-primary/20"
                                                >
                                                    {group.name}
                                                </Badge>
                                            ))}
                                            {completedGroups.length > 3 && (
                                                <span className="text-[11px] text-muted-foreground">
                                                    +{completedGroups.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Mobile Quick Links */}
                <div className="flex md:hidden overflow-x-auto pb-2 gap-3 no-scrollbar">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="flex-shrink-0 gap-2 rounded-xl"
                        onClick={() => setIsAddAttendanceOpen(true)}
                    >
                        <Plus className="h-4 w-4" /> Add
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0 gap-2 rounded-xl"
                        onClick={() => setIsQRModalOpen(true)}
                    >
                        <QrCode className="h-4 w-4" /> QR
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0 gap-2 rounded-xl"
                        onClick={() => setIsImportDialogOpen(true)}
                    >
                        <Upload className="h-4 w-4" /> Import
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0 gap-2 rounded-xl"
                        onClick={exportToPDF}
                    >
                        <Download className="h-4 w-4" /> PDF
                    </Button>
                </div>

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
                        {isAdminLikeRole && (
                            <Button
                                variant="outline"
                                className="gap-2 text-xs"
                                size="sm"
                                onClick={async () => {
                                    try {
                                        const result = await cleanupDuplicateAttendanceAction()
                                        toast.success(`Cleanup complete: ${result.deletedRecords} duplicate records removed, ${result.mergedSessions} sessions merged`)
                                        router.refresh()
                                    } catch (error: any) {
                                        toast.error(error.message || "Failed to cleanup duplicates")
                                    }
                                }}
                            >
                                <X className="h-3 w-3" />
                                Clean Duplicates
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => setIsQRModalOpen(true)}
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
                                                    if (!isSessionActive) {
                                                        setIsSessionActive(true)
                                                    }
                                                    const now = new Date()
                                                    const [hours, minutes] = cutoffTime.split(':').map(Number)
                                                    const cutoffDateTime = new Date(date)
                                                    cutoffDateTime.setHours(hours, minutes, 0, 0)
                                                    const isLate = now > cutoffDateTime

                                                    const newAttendance = { ...attendance }
                                                    filteredAllMembers.forEach(m => {
                                                        newAttendance[m.id] = { isPresent: true, isLate }
                                                    })
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
                                                    if (!isSessionActive) {
                                                        setIsSessionActive(true)
                                                    }
                                                    const newAttendance = { ...attendance }
                                                    filteredAllMembers.forEach(m => {
                                                        newAttendance[m.id] = { isPresent: false, isLate: false }
                                                    })
                                                    setAttendance(newAttendance)
                                                }}
                                            >
                                                Mark All Absent
                                            </Button>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <div className="flex-1 overflow-y-auto p-6 relative">
                                    <div className="space-y-4">
                                        {filteredAllMembers.map(member => (
                                            <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                                                <div>
                                                    <p className="font-semibold">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isLeadershipMeeting
                                                            ? member.status.replace(/_/g, ' ')
                                                            : (member.group?.name || "No Group")
                                                        }
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right mr-4">
                                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Attendance</p>
                                                        <p className="text-sm font-bold text-primary">{member._count?.attendance || 0}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-full border border-border/50">
                                                        <button
                                                            onClick={() => {
                                                                if (!isSessionActive) {
                                                                    setIsSessionActive(true)
                                                                }
                                                                const now = new Date()
                                                                const [hours, minutes] = cutoffTime.split(':').map(Number)
                                                                const cutoffDateTime = new Date(date)
                                                                cutoffDateTime.setHours(hours, minutes, 0, 0)

                                                                const isLate = now > cutoffDateTime
                                                                setAttendance(prev => ({
                                                                    ...prev,
                                                                    [member.id]: { isPresent: true, isLate }
                                                                }))
                                                            }}
                                                            className={cn(
                                                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all",
                                                                attendance[member.id]?.isPresent ? "bg-green-500 text-white" : "text-muted-foreground"
                                                            )}
                                                        >
                                                            {attendance[member.id]?.isPresent && attendance[member.id]?.isLate ? "LATE" : "PR"}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (!isSessionActive) {
                                                                    setIsSessionActive(true)
                                                                }
                                                                setAttendance(prev => ({
                                                                    ...prev,
                                                                    [member.id]: { isPresent: false, isLate: false }
                                                                }))
                                                            }}
                                                            className={cn(
                                                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all",
                                                                attendance[member.id]?.isPresent === false ? "bg-red-500 text-white" : "text-muted-foreground"
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
                                onClick={() => {
                                    // Check if it's a new day - if so, reset session
                                    const today = new Date()
                                    today.setHours(0, 0, 0, 0)
                                    const sessionDate = new Date(date)
                                    sessionDate.setHours(0, 0, 0, 0)

                                    if (sessionDate.getTime() !== today.getTime()) {
                                        setDate(today)
                                        setAttendance({})
                                        setNotes("")
                                    }
                                    setIsSessionActive(true)
                                }}
                            >
                                <Check className="h-4 w-4" /> Confirm & Start Marking
                            </Button>
                        ) : (
                            <div className="flex gap-2 items-center flex-wrap">
                                <Badge className="bg-green-500 text-white gap-2 px-3 py-1">
                                    <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                                    Session Active
                                </Badge>
                                {Object.keys(attendance).length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        {Object.keys(attendance).filter(id => attendance[id]?.isPresent).length} marked present
                                    </Badge>
                                )}
                                {eventType === EventType.SATURDAY_FELLOWSHIP && selectedGroupId && !todaysCompletedSet.has(selectedGroupId) && (
                                    <Button
                                        size="sm"
                                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => {
                                            const todayKey = date.toISOString().split('T')[0]
                                            const currentCompleted = completedGroupsByDate[todayKey] || []
                                            if (!currentCompleted.includes(selectedGroupId)) {
                                                setCompletedGroupsByDate({
                                                    ...completedGroupsByDate,
                                                    [todayKey]: [...currentCompleted, selectedGroupId]
                                                })
                                                toast.success(`Attendance for ${selectedGroup?.name || 'this group'} marked as complete!`)
                                            }
                                        }}
                                    >
                                        <Check className="h-4 w-4" /> Complete Attendance
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => {
                                        setIsSessionActive(false)
                                        setAttendance({})
                                        setNotes("")
                                        setSessionState(null) // Clear from localStorage
                                        toast.info("Session closed. All marked attendance has been cleared.")
                                    }}
                                >
                                    <X className="h-4 w-4" /> Close Session
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className={cn("flex flex-wrap gap-4", isSessionActive && "pointer-events-none opacity-70")}>
                        {eventType !== EventType.LEADERSHIP_MEETING && (
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
                        )}

                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                Fellowship Date
                            </label>
                            <div className="flex items-center h-10 px-3 py-2 rounded-md border border-border/50 bg-muted/30 text-muted-foreground cursor-not-allowed">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                <span className="text-sm">{mounted ? format(date, "PPP") : "Loading..."}</span>
                            </div>
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

                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                Cutoff Time (Late Arrival)
                            </label>
                            <Input
                                type="time"
                                value={cutoffTime}
                                onChange={(e) => setCutoffTime(e.target.value)}
                                className="bg-background/50 border-border/50"
                                disabled={isSessionActive}
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">Members arriving after this time will be marked as late</p>
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

                {/* Recent Attendance Sessions */}
                {recentSessions.length > 0 && (
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/20 px-4 md:px-6 py-4">
                            <div>
                                <CardTitle className="text-base md:text-lg font-medium">Recent Attendance Sessions</CardTitle>
                                <p className="text-xs text-muted-foreground">Click on a session to view member details</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => exportAttendanceToExcel(recentSessions)}
                            >
                                <Download className="h-4 w-4" />
                                Export All Sessions
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/10">
                                        <TableRow className="border-border/50">
                                            <TableHead className="font-bold uppercase tracking-wider text-[10px] w-8"></TableHead>
                                            <TableHead className="font-bold uppercase tracking-wider text-[10px]">Date</TableHead>
                                            <TableHead className="font-bold uppercase tracking-wider text-[10px]">Group</TableHead>
                                            <TableHead className="font-bold uppercase tracking-wider text-[10px]">Type</TableHead>
                                            <TableHead className="font-bold uppercase tracking-wider text-[10px] text-center">Present</TableHead>
                                            <TableHead className="font-bold uppercase tracking-wider text-[10px] text-center">Absent</TableHead>
                                            <TableHead className="font-bold uppercase tracking-wider text-[10px]">Recorded By</TableHead>
                                            {isAdminLikeRole && (
                                                <TableHead className="font-bold uppercase tracking-wider text-[10px] text-center w-16">Actions</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentSessions.map((session) => {
                                            const presentCount = session.records.filter(r => r.isPresent).length
                                            const absentCount = session.records.filter(r => !r.isPresent).length
                                            const isExpanded = expandedSessionId === session.id
                                            return (
                                                <React.Fragment key={session.id}>
                                                    <TableRow
                                                        className="border-border/50 hover:bg-primary/5 transition-colors cursor-pointer"
                                                        onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                                                    >
                                                        <TableCell>
                                                            {isExpanded ? (
                                                                <X className="h-4 w-4 text-muted-foreground" />
                                                            ) : (
                                                                <Plus className="h-4 w-4 text-muted-foreground" />
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-sm font-medium">
                                                            {format(new Date(session.date), "MMM d, yyyy")}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary" className="bg-muted/50 font-medium text-[10px]">
                                                                {session.group?.name || "N/A"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="text-[10px]">
                                                                {session.type.replace(/_/g, ' ')}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center font-bold text-green-600">
                                                            {presentCount}
                                                        </TableCell>
                                                        <TableCell className="text-center font-bold text-red-600">
                                                            {absentCount}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">
                                                            {session.recorder.name}
                                                        </TableCell>
                                                        {isAdminLikeRole && (
                                                            <TableCell className="text-center">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setDeleteSessionDialog({
                                                                            open: true,
                                                                            sessionId: session.id,
                                                                            sessionName: `${session.group?.name || 'Session'} - ${format(new Date(session.date), "MMM d, yyyy")}`
                                                                        })
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                    {isExpanded && (
                                                        <TableRow key={`${session.id}-details`} className="bg-muted/20">
                                                            <TableCell colSpan={isAdminLikeRole ? 9 : 8} className="p-0">
                                                                <div className="p-4">
                                                                    <div className="mb-3 flex items-center justify-between">
                                                                        <h4 className="font-semibold text-sm">Member Attendance Details</h4>
                                                                        <div className="flex gap-2">
                                                                            {isAdminLikeRole && (
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        setDeleteSessionDialog({
                                                                                            open: true,
                                                                                            sessionId: session.id,
                                                                                            sessionName: `${session.group?.name || 'Session'} - ${format(new Date(session.date), "MMM d, yyyy")}`
                                                                                        })
                                                                                    }}
                                                                                >
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                    Delete Session
                                                                                </Button>
                                                                            )}
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="gap-2"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    exportSessionToExcel(session)
                                                                                }}
                                                                            >
                                                                                <Download className="h-3 w-3" />
                                                                                Export This Session
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="overflow-x-auto">
                                                                        <Table>
                                                                            <TableHeader>
                                                                                <TableRow>
                                                                                    <TableHead className="text-[10px] font-bold">Member Name</TableHead>
                                                                                    <TableHead className="text-[10px] font-bold">Phone Number</TableHead>
                                                                                    <TableHead className="text-[10px] font-bold">Group</TableHead>
                                                                                    <TableHead className="text-[10px] font-bold">Status</TableHead>
                                                                                    <TableHead className="text-[10px] font-bold text-center">Attendance</TableHead>
                                                                                    {isAdminLikeRole && (
                                                                                        <TableHead className="text-[10px] font-bold text-center">Actions</TableHead>
                                                                                    )}
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {session.records.map((record) => (
                                                                                    <TableRow key={record.id || record.member.id}>
                                                                                        <TableCell className="text-sm font-medium">
                                                                                            {record.member.name}
                                                                                        </TableCell>
                                                                                        <TableCell className="text-xs text-muted-foreground">
                                                                                            {record.member.phoneNumber || "N/A"}
                                                                                        </TableCell>
                                                                                        <TableCell>
                                                                                            <Badge variant="secondary" className="bg-muted/50 font-medium text-[10px]">
                                                                                                {record.member.group?.name || "N/A"}
                                                                                            </Badge>
                                                                                        </TableCell>
                                                                                        <TableCell>
                                                                                            <Badge className={cn(
                                                                                                "uppercase font-bold text-[9px]",
                                                                                                record.member.status === "ESTABLISHED" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                                                                    record.member.status === "SEMI_CONSISTENT" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                                                                        "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                                                                            )}>
                                                                                                {record.member.status}
                                                                                            </Badge>
                                                                                        </TableCell>
                                                                                        <TableCell className="text-center">
                                                                                            {record.isPresent ? (
                                                                                                <Badge className={cn(
                                                                                                    "text-white font-bold text-[10px] px-2 py-1",
                                                                                                    record.isLate ? "bg-amber-500" : "bg-green-500"
                                                                                                )}>
                                                                                                    {record.isLate ? "Late" : "Present"}
                                                                                                </Badge>
                                                                                            ) : (
                                                                                                <Badge className="bg-red-500 text-white font-bold text-[10px] px-2 py-1">
                                                                                                    Absent
                                                                                                </Badge>
                                                                                            )}
                                                                                        </TableCell>
                                                                                        {isAdminLikeRole && (
                                                                                            <TableCell className="text-center">
                                                                                                <Button
                                                                                                    variant="ghost"
                                                                                                    size="sm"
                                                                                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation()
                                                                                                        setDeleteRecordDialog({
                                                                                                            open: true,
                                                                                                            recordId: record.id,
                                                                                                            memberName: record.member.name
                                                                                                        })
                                                                                                    }}
                                                                                                >
                                                                                                    <Trash2 className="h-3 w-3" />
                                                                                                </Button>
                                                                                            </TableCell>
                                                                                        )}
                                                                                    </TableRow>
                                                                                ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                                        <TableHead className="font-bold uppercase tracking-wider text-[10px]">{isLeadershipMeeting ? "Leader Name" : "Member Name"}</TableHead>
                                        <TableHead className="font-bold uppercase tracking-wider text-[10px]">{isLeadershipMeeting ? "Role" : "Ministry Group"}</TableHead>
                                        {!isLeadershipMeeting && (
                                            <TableHead className="font-bold uppercase tracking-wider text-[10px]">Status</TableHead>
                                        )}
                                        <TableHead className="font-bold uppercase tracking-wider text-[10px] text-center">Total Attendance</TableHead>
                                        {!isLeadershipMeeting && (
                                            <TableHead className="font-bold uppercase tracking-wider text-[10px] text-right">Progress</TableHead>
                                        )}
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
                                                    {isLeadershipMeeting
                                                        ? member.status.replace(/_/g, ' ')
                                                        : (member.group?.name || "No Group")
                                                    }
                                                </Badge>
                                            </TableCell>
                                            {!isLeadershipMeeting && (
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
                                            )}
                                            <TableCell className="text-center font-bold text-primary">
                                                {member._count?.attendance || 0}
                                            </TableCell>
                                            {!isLeadershipMeeting && (
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
                                            )}
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
                                                <CalendarIcon className="h-4 w-4 text-primary" />
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

            {/* QR Generator Modal */}
            <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Saturday Fellowship QR Code</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Branch</label>
                            <Select value={selectedBranchForQR} onValueChange={setSelectedBranchForQR}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(branch => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedBranchForQR && mounted && (
                            <div className="flex flex-col items-center gap-4 p-6 bg-muted/30 rounded-xl">
                                <div className="bg-white p-4 rounded-2xl shadow-lg">
                                    <QRCodeSVG
                                        value={`${window.location.origin}/check-in?branchId=${selectedBranchForQR}&type=SATURDAY_FELLOWSHIP`}
                                        size={200}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="font-semibold text-lg">
                                        {branches.find(b => b.id === selectedBranchForQR)?.name || "Branch"}
                                    </p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Saturday Fellowship
                                    </p>
                                </div>
                                <div className="flex gap-2 w-full">
                                    <Button
                                        variant="outline"
                                        className="flex-1 gap-2"
                                        onClick={() => {
                                            const checkInUrl = `${window.location.origin}/check-in?branchId=${selectedBranchForQR}&type=SATURDAY_FELLOWSHIP`
                                            navigator.clipboard.writeText(checkInUrl)
                                            setQrCopied(true)
                                            toast.success("Check-in link copied!")
                                            setTimeout(() => setQrCopied(false), 2000)
                                        }}
                                    >
                                        {qrCopied ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4" />
                                                Copy Link
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 gap-2"
                                        onClick={() => window.print()}
                                    >
                                        <Printer className="h-4 w-4" />
                                        Print
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Record Confirmation Dialog */}
            <Dialog open={deleteRecordDialog.open} onOpenChange={(open) => setDeleteRecordDialog({ ...deleteRecordDialog, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Attendance Record?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to delete the attendance record for <strong>{deleteRecordDialog.memberName}</strong>? 
                            This action cannot be undone and will be logged in the audit trail.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteRecordDialog({ open: false, recordId: null, memberName: "" })}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (!deleteRecordDialog.recordId) return
                                setIsDeleting(true)
                                try {
                                    const result = await deleteAttendanceRecordAction(deleteRecordDialog.recordId)
                                    toast.success(result.message)
                                    setDeleteRecordDialog({ open: false, recordId: null, memberName: "" })
                                    router.refresh()
                                } catch (error: any) {
                                    toast.error(error.message || "Failed to delete attendance record")
                                } finally {
                                    setIsDeleting(false)
                                }
                            }}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Session Confirmation Dialog */}
            <Dialog open={deleteSessionDialog.open} onOpenChange={(open) => setDeleteSessionDialog({ ...deleteSessionDialog, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Entire Session?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to delete the entire attendance session for <strong>{deleteSessionDialog.sessionName}</strong>? 
                            This will delete all attendance records in this session. This action cannot be undone and will be logged in the audit trail.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteSessionDialog({ open: false, sessionId: null, sessionName: "" })}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (!deleteSessionDialog.sessionId) return
                                setIsDeleting(true)
                                try {
                                    const result = await deleteAttendanceSessionAction(deleteSessionDialog.sessionId)
                                    toast.success(result.message)
                                    setDeleteSessionDialog({ open: false, sessionId: null, sessionName: "" })
                                    router.refresh()
                                } catch (error: any) {
                                    toast.error(error.message || "Failed to delete attendance session")
                                } finally {
                                    setIsDeleting(false)
                                }
                            }}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Session
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
