"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Building2, User, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { addGroupAction } from "../actions"

interface Group {
  id: string
  name: string
  branchId?: string
  leaderId?: string
  branch?: { name: string }
  leader?: { name: string }
  _count: { members: number }
}

interface GroupsClientProps {
  initialGroups: Group[]
  branches: { id: string; name: string }[]
  leaders: {
    id: string
    name: string
    managedBranch?: { id: string; name: string } | null
  }[]
}

export function GroupsClient({
  initialGroups,
  branches,
  leaders,
}: GroupsClientProps) {
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [searchTerm, setSearchTerm] = useState("")

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupBranchId, setNewGroupBranchId] = useState("")
  const [newGroupLeaderId, setNewGroupLeaderId] = useState("")

  const [isSaving, setIsSaving] = useState(false)

  // ✅ SAFE FILTER
  const filteredGroups = groups.filter((group) => {
    const term = searchTerm.toLowerCase()
    return (
      group.name.toLowerCase().includes(term) ||
      group.branch?.name?.toLowerCase().includes(term) ||
      group.leader?.name?.toLowerCase().includes(term)
    )
  })

  const filteredLeadersForNew = newGroupBranchId
    ? leaders.filter((l) => l.managedBranch?.id === newGroupBranchId)
    : []

  // =============================
  // ADD GROUP
  // =============================

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving) return

    if (!newGroupName.trim()) {
      toast.error("Group name is required")
      return
    }

    if (!newGroupBranchId) {
      toast.error("Branch is required")
      return
    }

    setIsSaving(true)

    try {
      const result: any = await addGroupAction({
        name: newGroupName.trim(),
        branchId: newGroupBranchId,
        leaderId: newGroupLeaderId || undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Group added successfully")

      if (result.group) {
        const created = result.group
        const branchMeta = branches.find((b) => b.id === created.branchId)
        const leaderMeta = leaders.find((l) => l.id === created.leaderId)

        setGroups((prev) => [
          ...prev,
          {
            id: created.id,
            name: created.name,
            branchId: created.branchId,
            leaderId: created.leaderId || undefined,
            branch: branchMeta ? { name: branchMeta.name } : undefined,
            leader: leaderMeta ? { name: leaderMeta.name } : undefined,
            _count: { members: 0 },
          },
        ])
      }

      resetAddForm()
    } catch {
      toast.error("Unexpected error")
    } finally {
      setIsSaving(false)
    }
  }

  const resetAddForm = () => {
    setNewGroupName("")
    setNewGroupBranchId("")
    setNewGroupLeaderId("")
    setIsAddDialogOpen(false)
  }

  // =============================
  // UI
  // =============================

  return (
    <div className="space-y-6">

      {/* SEARCH + ADD */}
      <div className="flex justify-between gap-4">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Ministry Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddGroup} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Add New Ministry Group</DialogTitle>
              </DialogHeader>

              <Input
                placeholder="Group Name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />

              <Select
                value={newGroupBranchId}
                onValueChange={(v) => {
                  setNewGroupBranchId(v)
                  setNewGroupLeaderId("")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={resetAddForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Add Group"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Leader</TableHead>
                <TableHead>Members</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>{group.branch?.name || "—"}</TableCell>
                  <TableCell>{group.leader?.name || "—"}</TableCell>
                  <TableCell>{group._count.members}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}
