"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Users,
    ClipboardCheck,
    TrendingUp,
    Award,
    ShieldCheck,
    Building2,
    ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const iconMap = {
    Users,
    ClipboardCheck,
    TrendingUp,
    Award,
    ShieldCheck,
    Building2,
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
import { createBranchAction } from "@/app/actions/branch"
import { createLeaderAction } from "@/app/actions/leader"
import { createGroupAction } from "@/app/actions/group"
import { addMemberAction } from "../members/actions"
import { toast } from "sonner"

interface Group {
    id: string
    name: string
}

interface Leader {
    id: string
    name: string
    email: string
    managedGroups: Array<{
        id: string
        name: string
        _count: {
            members: number
        }
    }>
}

interface Branch {
    id: string
    name: string
}

interface AdminDashboardClientProps {
    stats: Array<{
        name: string
        value: string
        iconName: "Users" | "ClipboardCheck" | "ShieldCheck" | "Building2" | "TrendingUp" | "Award"
        color: string
        trend: string
    }>
    leaders: Leader[]
    groups: Group[]
    branches?: Branch[]
}

export function AdminDashboardClient({
    stats,
    leaders,
    groups,
    branches = [],
}: AdminDashboardClientProps) {
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
    const [newMemberName, setNewMemberName] = useState("")
    const [newMemberPhone, setNewMemberPhone] = useState("")
    const [newMemberGroupId, setNewMemberGroupId] = useState(groups[0]?.id || "")
    const [newMemberBranchId, setNewMemberBranchId] = useState<string>("none")
    const [isSubmittingMember, setIsSubmittingMember] = useState(false)

    // Branch State
    const [isAddBranchOpen, setIsAddBranchOpen] = useState(false)
    const [newBranchName, setNewBranchName] = useState("")
    const [newBranchHeadId, setNewBranchHeadId] = useState<string>("none")
    const [isSubmittingBranch, setIsSubmittingBranch] = useState(false)

    // Leader State
    const [isAddLeaderOpen, setIsAddLeaderOpen] = useState(false)
    const [newLeaderName, setNewLeaderName] = useState("")
    const [newLeaderEmail, setNewLeaderEmail] = useState("")
    const [newLeaderRole, setNewLeaderRole] = useState<"PROBATION_LEADER" | "JUNIOR_LEADER" | "SENIOR_LEADER">("PROBATION_LEADER")
    const [newLeaderBranchId, setNewLeaderBranchId] = useState<string>("none")
    const [newLeaderGroupId, setNewLeaderGroupId] = useState<string>("none")
    const [isSubmittingLeader, setIsSubmittingLeader] = useState(false)

    // Group State
    const [isAddGroupOpen, setIsAddGroupOpen] = useState(false)
    const [newGroupName, setNewGroupName] = useState("")
    const [newGroupLeaderId, setNewGroupLeaderId] = useState<string>("none")
    const [newGroupBranchId, setNewGroupBranchId] = useState<string>("none")
    const [isSubmittingGroup, setIsSubmittingGroup] = useState(false)

    const quickActions = [
        { name: "Add Leader", icon: ShieldCheck, color: "bg-purple-500/10 text-purple-500", action: "leader" },
        { name: "Create Group", icon: Users, color: "bg-green-500/10 text-green-500", action: "group" },
        { name: "Create Branch", icon: Building2, color: "bg-amber-500/10 text-amber-500", action: "branch" },
        { name: "View Reports", icon: TrendingUp, color: "bg-blue-500/10 text-blue-500", href: "/reports" },
    ]

    const handleAddMember = async () => {
        if (!newMemberName || !newMemberGroupId) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSubmittingMember(true)
        try {
            await addMemberAction({
                name: newMemberName,
                phoneNumber: newMemberPhone || undefined,
                groupId: newMemberGroupId,
                branchId: newMemberBranchId === "none" ? undefined : newMemberBranchId
            })
            toast.success("Member added successfully", {
                description: `${newMemberName} has been added to the system.`
            })
            setIsAddMemberOpen(false)
            setNewMemberName("")
            setNewMemberPhone("")
            setNewMemberGroupId(groups[0]?.id || "")
            setNewMemberBranchId("none")
            setTimeout(() => window.location.reload(), 500)
        } catch (error: any) {
            toast.error(error.message || "Failed to add member")
        } finally {
            setIsSubmittingMember(false)
        }
    }

    const handleCreateBranch = async () => {
        if (!newBranchName) {
            toast.error("Branch name is required")
            return
        }

        setIsSubmittingBranch(true)
        try {
            await createBranchAction({
                name: newBranchName,
                headId: newBranchHeadId === "none" ? undefined : newBranchHeadId
            })
            toast.success("Branch created successfully", {
                description: `${newBranchName} is now active.`
            })
            setIsAddBranchOpen(false)
            setNewBranchName("")
            setNewBranchHeadId("none")
            setTimeout(() => window.location.reload(), 500)
        } catch (error: any) {
            toast.error(error.message || "Failed to create branch")
        } finally {
            setIsSubmittingBranch(false)
        }
    }

    const handleCreateLeader = async () => {
        if (!newLeaderName || !newLeaderEmail) {
            toast.error("Name and Email are required")
            return
        }

        // Validation: Only Senior Leaders can have a branch
        if (newLeaderBranchId !== "none" && newLeaderRole !== "SENIOR_LEADER") {
            toast.error("Only Senior Leaders can be assigned to a branch")
            return
        }

        setIsSubmittingLeader(true)
        try {
            await createLeaderAction({
                name: newLeaderName,
                email: newLeaderEmail,
                role: newLeaderRole,
                groupId: newLeaderGroupId === "none" ? undefined : newLeaderGroupId,
            })
            toast.success("Leader created successfully", {
                description: `Account for ${newLeaderName} has been created.`
            })
            setIsAddLeaderOpen(false)
            setNewLeaderName("")
            setNewLeaderEmail("")
            setNewLeaderRole("PROBATION_LEADER")
            setNewLeaderBranchId("none")
            setNewLeaderGroupId("none")
        } catch (error: any) {
            toast.error(error.message || "Failed to create leader")
        } finally {
            setIsSubmittingLeader(false)
        }
    }

    const handleCreateGroup = async () => {
        if (!newGroupName) {
            toast.error("Group name is required")
            return
        }

        setIsSubmittingGroup(true)
        try {
            await createGroupAction({
                name: newGroupName,
                leaderId: newGroupLeaderId === "none" ? undefined : newGroupLeaderId,
                branchId: newGroupBranchId === "none" ? undefined : newGroupBranchId
            })
            toast.success("Group created successfully", {
                description: `${newGroupName} has been added.`
            })
            setIsAddGroupOpen(false)
            setNewGroupName("")
            setNewGroupLeaderId("none")
            setNewGroupBranchId("none")
        } catch (error: any) {
            toast.error(error.message || "Failed to create group")
        } finally {
            setIsSubmittingGroup(false)
        }
    }

    return (
        <div className="space-y-6 pb-24 lg:pb-12">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 md:p-8 border border-primary/10">
                <div className="relative z-10 flex flex-col gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-base md:text-lg text-muted-foreground max-w-xl">
                            Manage all leaders, members, and ministry groups across the system.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/admin/leaders">
                            <Button className="rounded-full px-6 shadow-lg shadow-primary/20">Manage Leaders</Button>
                        </Link>
                        <Link href="/members">
                            <Button variant="outline" className="rounded-full px-6 bg-background/50 backdrop-blur-sm">All Members</Button>
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
                                if (action.action === "member") setIsAddMemberOpen(true)
                                if (action.action === "branch") setIsAddBranchOpen(true)
                                if (action.action === "leader") setIsAddLeaderOpen(true)
                                if (action.action === "group") setIsAddGroupOpen(true)
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

            {/* Recent Leaders */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Leaders</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Recently added leaders and their groups</p>
                    </div>
                    <Link href="/admin/leaders">
                        <Button variant="outline" size="sm">View All</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {leaders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No leaders yet. Add your first leader to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {leaders.map((leader) => (
                                <div
                                    key={leader.id}
                                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <ShieldCheck className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{leader.name}</p>
                                            <p className="text-sm text-muted-foreground">{leader.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {leader.managedGroups.length > 0 ? (
                                            leader.managedGroups.map((group) => (
                                                <Badge key={group.id} variant="secondary">
                                                    {group.name} ({group._count.members})
                                                </Badge>
                                            ))
                                        ) : (
                                            <Badge variant="outline">No groups</Badge>
                                        )}
                                        <Link href={`/admin/leaders/${leader.id}`}>
                                            <Button variant="ghost" size="sm">View</Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

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
                                    {groups && groups.length > 0 ? (
                                        groups.map(group => (
                                            <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="no-groups" disabled>No groups available</SelectItem>
                                    )}
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
                        <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddMember} disabled={isSubmittingMember}>
                            {isSubmittingMember ? "Adding..." : "Add Member"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Branch Modal */}
            <Dialog open={isAddBranchOpen} onOpenChange={setIsAddBranchOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create New Branch</DialogTitle>
                        <DialogDescription>
                            Enter the name of the new ministry branch (e.g., "Headquarters", "Eastern").
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Branch Name</label>
                            <Input
                                placeholder="e.g. Headquarters"
                                value={newBranchName}
                                onChange={(e) => setNewBranchName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Head Leader (Optional)</label>
                            <Select value={newBranchHeadId} onValueChange={setNewBranchHeadId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a senior leader" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {leaders.map(leader => (
                                        <SelectItem key={leader.id} value={leader.id}>{leader.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddBranchOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateBranch} disabled={isSubmittingBranch}>
                            {isSubmittingBranch ? "Creating..." : "Create Branch"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Leader Modal */}
            <Dialog open={isAddLeaderOpen} onOpenChange={setIsAddLeaderOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Leader</DialogTitle>
                        <DialogDescription>
                            Create a new leader account. Default password will be 'leader123'.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input
                                placeholder="Jane Doe"
                                value={newLeaderName}
                                onChange={(e) => setNewLeaderName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <Input
                                type="email"
                                placeholder="jane@mor.org"
                                value={newLeaderEmail}
                                onChange={(e) => setNewLeaderEmail(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Role</label>
                            <Select value={newLeaderRole} onValueChange={(value: any) => setNewLeaderRole(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PROBATION_LEADER">Probation Leader</SelectItem>
                                    <SelectItem value="JUNIOR_LEADER">Junior Leader</SelectItem>
                                    <SelectItem value="SENIOR_LEADER">Senior Leader</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Assign to Group (Optional)</label>
                            <Select value={newLeaderGroupId} onValueChange={setNewLeaderGroupId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select group" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {groups.map(group => (
                                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddLeaderOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateLeader} disabled={isSubmittingLeader}>
                            {isSubmittingLeader ? "Creating..." : "Create Leader"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Group Modal */}
            <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create Ministry Group</DialogTitle>
                        <DialogDescription>
                            Create a new ministry group (e.g., "Choir", "Ushers"). You can assign a leader now or later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Group Name</label>
                            <Input
                                placeholder="e.g. Choir"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Assign Leader (Optional)</label>
                            <Select value={newGroupLeaderId} onValueChange={setNewGroupLeaderId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select leader" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {leaders.map(leader => (
                                        <SelectItem key={leader.id} value={leader.id}>{leader.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Assign to Branch (Optional)</label>
                            <Select value={newGroupBranchId} onValueChange={setNewGroupBranchId}>
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
                        <Button variant="outline" onClick={() => setIsAddGroupOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateGroup} disabled={isSubmittingGroup}>
                            {isSubmittingGroup ? "Creating..." : "Create Group"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

