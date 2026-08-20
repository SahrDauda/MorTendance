"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Users,
    ClipboardCheck,
    TrendingUp,
    Award,
    PlusCircle,
    FileText,
    ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const iconMap = {
    Users,
    ClipboardCheck,
    TrendingUp,
    Award,
    PlusCircle,
    FileText,
}
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addMemberAction } from "../members/actions"
import { saveAttendanceAction } from "../attendance/actions"
import { toast } from "sonner"
import { format } from "date-fns"
import { Search as SearchIcon } from "lucide-react"
import { EventType } from "@prisma/client"

interface Group {
    id: string
    name: string
    branchId?: string | null
    branch?: {
        id: string
        name: string
    } | null
    members: Array<{
        id: string
        name: string
        status: string
    }>
    _count: {
        members: number
    }
}

interface Member {
    id: string
    name: string
    status: string
    phoneNumber?: string
    group?: { name: string }
    _count?: { attendance: number }
}

interface Branch {
    id: string
    name: string
    _count: {
        groups: number
        members: number
        cbsLocations: number
    }
}

interface CBSLocation {
    id: string
    name: string
    branch: { name: string }
    _count: {
        attendanceSessions: number
    }
}

interface LeaderDashboardClientProps {
    leaderName: string
    stats: Array<{
        name: string
        value: string
        iconName: "Users" | "ClipboardCheck" | "TrendingUp" | "Award" | "PlusCircle" | "FileText"
        color: string
        trend: string
    }>
    leaderGroups: Group[]
    managedBranch?: Branch | null
    managedCBS?: CBSLocation[]
    attendanceRecords: number
    presentRecords: number
    allMembers?: Member[]
}

export function LeaderDashboardClient({
    leaderName,
    stats,
    leaderGroups,
    managedBranch,
    managedCBS = [],
    attendanceRecords,
    presentRecords,
    allMembers = [],
}: LeaderDashboardClientProps) {
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
    const [isTakeAttendanceOpen, setIsTakeAttendanceOpen] = useState(false)
    const [newMemberName, setNewMemberName] = useState("")
    const [newMemberPhone, setNewMemberPhone] = useState("")
    const [newMemberGroupId, setNewMemberGroupId] = useState(leaderGroups[0]?.id || "")
    const [isSubmittingMember, setIsSubmittingMember] = useState(false)

    // Attendance modal state
    const [attendanceDate, setAttendanceDate] = useState<Date>(new Date())
    const [attendanceContext, setAttendanceContext] = useState<"GROUP" | "CBS">("GROUP")
    const [attendanceGroupId, setAttendanceGroupId] = useState(leaderGroups[0]?.id || "")
    const [attendanceCBSId, setAttendanceCBSId] = useState(managedCBS[0]?.id || "")
    const [attendanceType, setAttendanceType] = useState<EventType>(EventType.SATURDAY_FELLOWSHIP)
    const [attendanceNotes, setAttendanceNotes] = useState("")
    const [attendance, setAttendance] = useState<Record<string, boolean>>({})
    const [memberSearchTerm, setMemberSearchTerm] = useState("")
    const [isSavingAttendance, setIsSavingAttendance] = useState(false)

    // Update default context if user only has CBS
    useEffect(() => {
        if (leaderGroups.length === 0 && managedCBS.length > 0) {
            setAttendanceContext("CBS")
        }
    }, [leaderGroups.length, managedCBS.length])

    const quickActions = [
        { name: "Take Attendance", icon: ClipboardCheck, color: "bg-blue-500/10 text-blue-500", action: "attendance" },
        { name: "Add Member", icon: PlusCircle, color: "bg-green-500/10 text-green-500", action: "member" },
        { name: "Reports", icon: FileText, color: "bg-purple-500/10 text-purple-500", href: "/reports" },
        { name: "My Members", icon: Users, color: "bg-amber-500/10 text-amber-500", href: "/members" },
    ]

    const handleAddMember = async () => {
        if (!newMemberName || !newMemberGroupId) {
            toast.error("Please fill in all required fields")
            return
        }

        const selectedGroup = leaderGroups.find(g => g.id === newMemberGroupId)
        setIsSubmittingMember(true)
        try {
            await addMemberAction({
                name: newMemberName,
                phoneNumber: newMemberPhone || undefined,
                groupId: newMemberGroupId,
                branchId: selectedGroup?.branchId || ""
            })
            toast.success("Member added successfully")
            setIsAddMemberOpen(false)
            setNewMemberName("")
            setNewMemberPhone("")
            setNewMemberGroupId("")
            // Use router.refresh() for better UX
            setTimeout(() => window.location.reload(), 500)
        } catch (error: any) {
            toast.error(error.message || "Failed to add member")
        } finally {
            setIsSubmittingMember(false)
        }
    }

    const handleSaveAttendance = async () => {
        if (attendanceContext === "GROUP" && !attendanceGroupId) {
            toast.error("Please select a group")
            return
        }
        if (attendanceContext === "CBS" && !attendanceCBSId) {
            toast.error("Please select a CBS location")
            return
        }

        let membersToMark: Member[] = []

        if (attendanceContext === "GROUP") {
            const selectedGroup = leaderGroups.find(g => g.id === attendanceGroupId)
            if (!selectedGroup) {
                toast.error("Group not found")
                return
            }
            // For groups, we only show members of that group
            membersToMark = selectedGroup.members.map(m => ({ ...m, group: { name: selectedGroup.name } }))
        } else {
            const selectedCBS = managedCBS.find(c => c.id === attendanceCBSId)
            if (!selectedCBS) {
                toast.error("CBS Location not found")
                return
            }
            // For CBS, we show ALL members available to the leader
            membersToMark = allMembers
        }

        const memberIdsToSave = Object.keys(attendance).filter(id =>
            membersToMark.some(m => m.id === id)
        )

        if (memberIdsToSave.length === 0) {
            toast.error("Please mark attendance for at least one member")
            return
        }

        setIsSavingAttendance(true)
        try {
            const records = memberIdsToSave.map(id => ({
                memberId: id,
                isPresent: !!attendance[id]
            }))

            await saveAttendanceAction({
                groupId: attendanceContext === "GROUP" ? attendanceGroupId : undefined,
                cbsLocationId: attendanceContext === "CBS" ? attendanceCBSId : undefined,
                type: attendanceContext === "CBS" ? EventType.CBS : attendanceType,
                date: attendanceDate,
                records,
                notes: attendanceNotes || undefined
            })
            toast.success("Attendance saved successfully")
            setIsTakeAttendanceOpen(false)
            setAttendance({})
            // Use router.refresh() for better UX
            setTimeout(() => window.location.reload(), 500)
        } catch (error: any) {
            toast.error(error.message || "Failed to save attendance")
        } finally {
            setIsSavingAttendance(false)
        }
    }

    const getFilteredMembersForAttendance = () => {
        let members: Member[] = []
        if (attendanceContext === "GROUP") {
            const group = leaderGroups.find(g => g.id === attendanceGroupId)
            if (group) {
                members = group.members.map(m => ({ ...m, group: { name: group.name } }))
            }
        } else {
            // For CBS, show all members available to the leader
            members = allMembers
        }

        return members.filter(member =>
            member.name.toLowerCase().includes(memberSearchTerm.toLowerCase())
        )
    }

    const selectedGroup = leaderGroups.find(g => g.id === attendanceGroupId)

    return (
        <div className="space-y-6 pb-24 lg:pb-12">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 md:p-8 border border-primary/10">
                <div className="relative z-10 flex flex-col gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Welcome, {leaderName}</h1>
                        <p className="text-base md:text-lg text-muted-foreground max-w-xl">
                            Manage your fellowship groups and track member growth and consistency.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            className="rounded-full px-6 shadow-lg shadow-primary/20"
                            onClick={() => setIsTakeAttendanceOpen(true)}
                        >
                            Take Attendance
                        </Button>
                        <Link href="/members">
                            <Button variant="outline" className="rounded-full px-6 bg-background/50 backdrop-blur-sm">My Members</Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {quickActions.map((action) => {
                    if (action.href) {
                        return (
                            <Link key={action.name} href={action.href}>
                                <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-card/50 border border-border/50 transition-all hover:bg-primary/5 hover:border-primary/20 group backdrop-blur-sm h-full cursor-pointer">
                                    <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", action.color)}>
                                        <action.icon className="h-5 w-5 md:h-6 md:w-6" />
                                    </div>
                                    <span className="text-xs md:text-sm font-semibold text-center">{action.name}</span>
                                </div>
                            </Link>
                        )
                    }
                    return (
                        <div
                            key={action.name}
                            onClick={() => {
                                if (action.action === "attendance") setIsTakeAttendanceOpen(true)
                                if (action.action === "member") setIsAddMemberOpen(true)
                            }}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-card/50 border border-border/50 transition-all hover:bg-primary/5 hover:border-primary/20 group backdrop-blur-sm h-full cursor-pointer"
                        >
                            <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", action.color)}>
                                <action.icon className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                            <span className="text-xs md:text-sm font-semibold text-center">{action.name}</span>
                        </div>
                    )
                })}
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat) => (
                    <Card key={stat.name} className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:shadow-lg">
                        <CardContent className="p-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div className={cn("rounded-lg p-2 bg-muted/50 group-hover:bg-primary/10 transition-colors")}>
                                    {(() => {
                                        const Icon = iconMap[stat.iconName as keyof typeof iconMap]
                                        return <Icon className={`h-5 w-5 ${stat.color}`} />
                                    })()}
                                </div>
                                <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{stat.name}</p>
                                <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    {stat.trend}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* My Branch Section (Only for Branch Heads) */}
            {managedBranch && (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-xl">🏢</span> My Branch: {managedBranch.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Branch Overview</p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                                <p className="text-sm text-muted-foreground">Total Groups</p>
                                <p className="text-2xl font-bold">{managedBranch._count.groups}</p>
                            </div>
                            <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                                <p className="text-sm text-muted-foreground">Total Members</p>
                                <p className="text-2xl font-bold">{managedBranch._count.members}</p>
                            </div>
                            <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                                <p className="text-sm text-muted-foreground">CBS Locations</p>
                                <p className="text-2xl font-bold">{managedBranch._count.cbsLocations}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Link href={`/admin/branches/${managedBranch.id}`}>
                                <Button variant="outline" size="sm">Manage Branch</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* My CBS Locations Section (Only for CBS Leaders) */}
            {managedCBS && managedCBS.length > 0 && (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-xl">🏛️</span> My CBS Locations
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Community Bible Study Locations</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {managedCBS.map((cbs) => (
                                <div
                                    key={cbs.id}
                                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                                >
                                    <div>
                                        <p className="font-semibold">{cbs.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {cbs.branch.name} • {cbs._count.attendanceSessions} sessions
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Link href={`/cbs/${cbs.id}`}>
                                            <Button variant="outline" size="sm">Manage CBS</Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* My Groups */}
            {leaderGroups.length > 0 && (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>My Groups</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Groups you are managing</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {leaderGroups.map((group) => {
                                const groupMemberIds = group.members.map(m => m.id)
                                const groupAttendanceRecords = attendanceRecords
                                const groupPresentRecords = presentRecords
                                const groupAttendance = groupAttendanceRecords > 0
                                    ? Math.round((groupPresentRecords / groupAttendanceRecords) * 100)
                                    : 0

                                return (
                                    <div
                                        key={group.id}
                                        className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                                    >
                                        <div>
                                            <p className="font-semibold">{group.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {group._count.members} members
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-medium">{groupAttendance}%</p>
                                                <p className="text-xs text-muted-foreground">Attendance</p>
                                            </div>
                                            <Link href={`/attendance?group=${group.id}`}>
                                                <Button variant="outline" size="sm">Manage</Button>
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Add Member Modal */}
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
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
                                    {leaderGroups && leaderGroups.length > 0 ? (
                                        leaderGroups.map(group => (
                                            <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="no-groups" disabled>No groups available</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddMember} disabled={isSubmittingMember}>
                            {isSubmittingMember ? "Adding..." : "Add Member"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Take Attendance Modal */}
            <Dialog open={isTakeAttendanceOpen} onOpenChange={setIsTakeAttendanceOpen}>
                <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 border-b">
                        <DialogTitle>Mark Attendance</DialogTitle>

                        {/* Context Switcher */}
                        {(leaderGroups.length > 0 && managedCBS.length > 0) && (
                            <div className="flex p-1 bg-muted rounded-lg mt-4">
                                <button
                                    className={cn(
                                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                                        attendanceContext === "GROUP" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => setAttendanceContext("GROUP")}
                                >
                                    Ministry Group
                                </button>
                                <button
                                    className={cn(
                                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                                        attendanceContext === "CBS" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => setAttendanceContext("CBS")}
                                >
                                    CBS Location
                                </button>
                            </div>
                        )}

                        <div className="space-y-4 mt-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Date</label>
                                <Input
                                    type="date"
                                    value={format(attendanceDate, "yyyy-MM-dd")}
                                    onChange={(e) => setAttendanceDate(new Date(e.target.value))}
                                />
                            </div>

                            {attendanceContext === "GROUP" ? (
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Ministry Group</label>
                                    <Select value={attendanceGroupId} onValueChange={setAttendanceGroupId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select group" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {leaderGroups && leaderGroups.length > 0 ? (
                                                leaderGroups.map(group => (
                                                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no-groups" disabled>No groups available</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">CBS Location</label>
                                    <Select value={attendanceCBSId} onValueChange={setAttendanceCBSId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select CBS location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {managedCBS && managedCBS.length > 0 ? (
                                                managedCBS.map(cbs => (
                                                    <SelectItem key={cbs.id} value={cbs.id}>{cbs.name}</SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no-cbs" disabled>No CBS locations available</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Event Type</label>
                                {attendanceContext === "CBS" ? (
                                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-sm text-muted-foreground flex items-center">
                                        CBS (Community Bible Study)
                                    </div>
                                ) : (
                                    <Select value={attendanceType} onValueChange={(v) => setAttendanceType(v as EventType)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select event type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(EventType)
                                                .filter(type => {
                                                    if (type === EventType.CBS) return false
                                                    // If not a branch head, only allow Saturday Fellowship
                                                    if (!managedBranch && type !== EventType.SATURDAY_FELLOWSHIP) return false
                                                    return true
                                                })
                                                .map(type => (
                                                    <SelectItem key={type} value={type}>
                                                        {type.replace(/_/g, ' ')}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Notes (Optional)</label>
                                <Input
                                    placeholder="Add any specific notes..."
                                    value={attendanceNotes}
                                    onChange={(e) => setAttendanceNotes(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search members..."
                                    className="pl-9"
                                    value={memberSearchTerm}
                                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-4">
                            {getFilteredMembersForAttendance().map(member => (
                                <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                                    <div>
                                        <p className="font-semibold">{member.name}</p>
                                        <p className="text-xs text-muted-foreground">{member.group?.name || "Member"}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-full border border-border/50">
                                        <button
                                            onClick={() => setAttendance(prev => ({ ...prev, [member.id]: true }))}
                                            className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all",
                                                attendance[member.id] ? "bg-green-500 text-white" : "text-muted-foreground"
                                            )}
                                        >
                                            Present
                                        </button>
                                        <button
                                            onClick={() => setAttendance(prev => ({ ...prev, [member.id]: false }))}
                                            className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all",
                                                attendance[member.id] === false ? "bg-red-500 text-white" : "text-muted-foreground"
                                            )}
                                        >
                                            Absent
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t bg-muted/20">
                        <Button variant="outline" onClick={() => setIsTakeAttendanceOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveAttendance} disabled={isSavingAttendance}>
                            {isSavingAttendance ? "Saving..." : "Save Attendance"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
