"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Users,
  Building,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Sparkles,
} from "lucide-react"

interface CampGroup {
  id: string
  name: string
  leader: string | null
  color: string | null
  memberCount: number
}

interface CampBranch {
  id: string
  name: string
  leader?: string | null
  coordinator?: string | null
  district?: string | null
  memberCount: number
}

interface Attendee {
  id: string
  badgeId: string
  fullName: string
  branch: string | null
  caregroup: string | null
  room: string | null
  phone: string | null
  position?: string
}

export function CampGroupsClient({ userRole }: { userRole: string }) {
  const [groups, setGroups] = useState<CampGroup[]>([])
  const [branches, setBranches] = useState<CampBranch[]>([])
  const [members, setMembers] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [editGroupOpen, setEditGroupOpen] = useState(false)
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<CampGroup | null>(null)

  const [addBranchOpen, setAddBranchOpen] = useState(false)
  const [editBranchOpen, setEditBranchOpen] = useState(false)
  const [deleteBranchOpen, setDeleteBranchOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<CampBranch | null>(null)

  const [rosterModalOpen, setRosterModalOpen] = useState(false)
  const [rosterTitle, setRosterTitle] = useState("")
  const [rosterMembers, setRosterMembers] = useState<Attendee[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [groupForm, setGroupForm] = useState({ name: "", leader: "", color: "" })
  const [branchForm, setBranchForm] = useState({ name: "", leader: "" })

  // Filter registered attendees to only those with "Leader" position
  const availableLeaders = useMemo(() => {
    return members.filter((m) => {
      const pos = (m.position || "").trim().toLowerCase()
      return pos.includes("leader")
    })
  }, [members])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [groupsRes, branchesRes, membersRes] = await Promise.all([
        fetch("/api/camp/groups"),
        fetch("/api/camp/branches"),
        fetch("/api/camp/members"),
      ])

      const [groupsData, branchesData, membersData] = await Promise.all([
        groupsRes.json(),
        branchesRes.json(),
        membersRes.json(),
      ])

      if (groupsData.success) setGroups(groupsData.data)
      if (branchesData.success) setBranches(branchesData.data)
      if (membersData.success) setMembers(membersData.data)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load groups and branches")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])



  // Edit Group
  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup || !groupForm.name.trim()) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/camp/groups/${selectedGroup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupForm.name.trim(),
          leader: groupForm.leader ? groupForm.leader.trim() : null,
          color: groupForm.color ? groupForm.color.trim() : null,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success("Group updated successfully")
        setEditGroupOpen(false)
        await fetchData()
      } else {
        toast.error(data.error || "Failed to update group")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Group
  const handleDeleteGroup = async () => {
    if (!selectedGroup) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/camp/groups/${selectedGroup.id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`Group "${selectedGroup.name}" deleted`)
        setDeleteGroupOpen(false)
        await fetchData()
      } else {
        toast.error(data.error || "Failed to delete group")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // Create Branch
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchForm.name.trim()) {
      toast.error("Please provide branch name")
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch("/api/camp/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branchForm),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`Branch "${data.data.name}" saved`)
        setAddBranchOpen(false)
        setBranchForm({ name: "", leader: "" })
        await fetchData()
      } else {
        toast.error(data.error || "Failed to save branch")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Branch
  const handleDeleteBranch = async () => {
    if (!selectedBranch) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/camp/branches/${selectedBranch.id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`Branch "${selectedBranch.name}" deleted`)
        setDeleteBranchOpen(false)
        await fetchData()
      } else {
        toast.error(data.error || "Failed to delete branch")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // View Group Roster
  const openGroupRoster = (group: CampGroup) => {
    const list = members.filter((m) => m.caregroup === group.name)
    setRosterTitle(`Group: ${group.name}`)
    setRosterMembers(list)
    setRosterModalOpen(true)
  }

  // View Branch Roster
  const openBranchRoster = (branch: CampBranch) => {
    const list = members.filter((m) => m.branch === branch.name)
    setRosterTitle(`Branch: ${branch.name}`)
    setRosterMembers(list)
    setRosterModalOpen(true)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              MOR Camp Structure
            </span>
            <span className="text-xs text-muted-foreground">Fellowship & Delegations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-foreground">
            Groups & Branches
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage camp fellowship teams and sending branch delegations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 font-medium"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="groups" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="groups" className="rounded-lg gap-2">
            <Users className="w-4 h-4" />
            Camp Groups ({groups.length})
          </TabsTrigger>
          <TabsTrigger value="branches" className="rounded-lg gap-2">
            <Building className="w-4 h-4" />
            Sending Branches ({branches.length})
          </TabsTrigger>
        </TabsList>

        {/* Groups Content */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">Active Camp Groups</h2>
              <p className="text-xs text-muted-foreground">
                Official camp fellowship groups for MOR Camp 2026
              </p>
            </div>
          </div>

          {groups.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="text-lg font-bold text-foreground">No Camp Groups Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                Loading official camp groups...
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groups.map((group) => (
                <Card
                  key={group.id}
                  className="border shadow-sm bg-card hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-bold text-foreground">
                        {group.name}
                      </CardTitle>
                      <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 font-semibold">
                        {group.memberCount} Members
                      </Badge>
                    </div>
                    <CardDescription className="text-xs mt-1">
                      Leader: <span className="font-semibold text-foreground">{group.leader || "Unassigned"}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1.5 font-medium"
                      onClick={() => openGroupRoster(group)}
                    >
                      <Users className="w-3.5 h-3.5" />
                      View Roster ({group.memberCount})
                    </Button>

                    <div className="flex items-center justify-end gap-1 pt-1 border-t">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                        onClick={() => {
                          setSelectedGroup(group)
                          setGroupForm({
                            name: group.name,
                            leader: group.leader || "",
                            color: group.color || "",
                          })
                          setEditGroupOpen(true)
                        }}
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-red-500 hover:bg-red-500/10 gap-1"
                        onClick={() => {
                          setSelectedGroup(group)
                          setDeleteGroupOpen(true)
                        }}
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Branches Content */}
        <TabsContent value="branches" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Sending Branches</h2>
              <p className="text-xs text-muted-foreground">
                Originating branches sending delegates to MOR Camp 2026
              </p>
            </div>
            <Button
              className="bg-primary text-white gap-2 font-semibold"
              onClick={() => {
                setBranchForm({ name: "", leader: "" })
                setAddBranchOpen(true)
              }}
            >
              <Plus className="w-4 h-4" />
              Add Branch
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <Card
                key={branch.id}
                className="border shadow-sm bg-card hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-bold text-foreground">
                      {branch.name}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-700">
                      {branch.memberCount} Delegates
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    Leader: <span className="font-semibold text-foreground">{branch.leader || branch.coordinator || "Unassigned"}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1.5"
                    onClick={() => openBranchRoster(branch)}
                  >
                    <Users className="w-3.5 h-3.5" />
                    View Delegates ({branch.memberCount})
                  </Button>

                  <div className="flex items-center justify-end gap-1 pt-1 border-t">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-red-500 hover:bg-red-500/10 gap-1"
                      onClick={() => {
                        setSelectedBranch(branch)
                        setDeleteBranchOpen(true)
                      }}
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Group Modal */}
      <Dialog open={editGroupOpen} onOpenChange={setEditGroupOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Group</DialogTitle>
            <DialogDescription>
              Update group name or assigned leader.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditGroup} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="editGroupName">Group Name *</Label>
              <Input
                id="editGroupName"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editGroupLeader">Group Leader</Label>
              <Select
                value={groupForm.leader || "NONE"}
                onValueChange={(val) =>
                  setGroupForm({ ...groupForm, leader: val === "NONE" ? "" : val })
                }
              >
                <SelectTrigger id="editGroupLeader" className="w-full">
                  <SelectValue placeholder="Select leader from registered attendees" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="NONE">-- No Leader Assigned --</SelectItem>
                  {groupForm.leader && !availableLeaders.some((m) => m.fullName === groupForm.leader) && (
                    <SelectItem value={groupForm.leader}>
                      {groupForm.leader} (Current)
                    </SelectItem>
                  )}
                  {availableLeaders.length === 0 ? (
                    <div className="p-2.5 text-xs text-muted-foreground text-center">
                      No attendees with role &quot;Leader&quot; found.
                    </div>
                  ) : (
                    availableLeaders.map((m) => (
                      <SelectItem key={m.id} value={m.fullName}>
                        ⭐ {m.fullName} ({m.badgeId}{m.branch ? ` • ${m.branch}` : ""})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditGroupOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white" disabled={submitting}>
                {submitting ? "Updating..." : "Update Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Group Modal */}
      <Dialog open={deleteGroupOpen} onOpenChange={setDeleteGroupOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Group
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete group{" "}
              <strong className="text-foreground">{selectedGroup?.name}</strong>? Any attendees assigned to this group will become unassigned.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteGroupOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Branch Modal */}
      <Dialog open={addBranchOpen} onOpenChange={setAddBranchOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Create New Branch</DialogTitle>
            <DialogDescription>
              Enter the name of the new sending branch (e.g. Headquarters, Bo, Eastern).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddBranch} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="branchName">Branch Name *</Label>
              <Input
                id="branchName"
                placeholder="e.g. Headquarters"
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="branchLeader">Head Leader / Coordinator</Label>
              <Input
                id="branchLeader"
                placeholder="e.g. Pastor in Charge"
                value={branchForm.leader}
                onChange={(e) => setBranchForm({ ...branchForm, leader: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddBranchOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white" disabled={submitting}>
                {submitting ? "Saving..." : "Save Branch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Modal */}
      <Dialog open={deleteBranchOpen} onOpenChange={setDeleteBranchOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Branch
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete branch{" "}
              <strong className="text-foreground">{selectedBranch?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteBranchOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteBranch}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Roster Modal */}
      <Dialog open={rosterModalOpen} onOpenChange={setRosterModalOpen}>
        <DialogContent className="max-w-lg bg-card max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{rosterTitle}</DialogTitle>
            <DialogDescription>
              {rosterMembers.length} attendees assigned
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2 py-2">
            {rosterMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No attendees assigned to this group yet.
              </p>
            ) : (
              rosterMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl border bg-background/50 hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <div className="font-bold text-sm text-foreground">{m.fullName}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {m.badgeId} • {m.branch || "No Branch"}
                    </div>
                  </div>
                  {m.room && (
                    <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 border-amber-300">
                      {m.room}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button variant="outline" onClick={() => setRosterModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
