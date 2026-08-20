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
  CreditCard,
  Building,
  BedDouble,
  Search,
  Plus,
  QrCode,
  Edit2,
  Trash2,
  RefreshCw,
  Shuffle,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  Download,
} from "lucide-react"
import { MorTagDialog } from "@/components/camp/mor-tag-dialog"
import { downloadAttendeeBadge } from "@/lib/campBadgeHelper"
import Link from "next/link"

interface CampMember {
  id: string
  badgeId: string
  fullName: string
  phone: string | null
  gender: string
  branch: string | null
  caregroup: string | null
  room: string | null
  position: string
  paid: boolean
  paidAmount: number | null
  paymentClaimed: boolean
  couponNum: number
  foodReceived: boolean
  createdAt: string
}

interface CampGroup {
  id: string
  name: string
}

interface CampBranch {
  id: string
  name: string
}

interface CampRoom {
  id: string
  name: string
  gender: string
  capacity: number
  occupied: number
  available: number
}

// Helpers for formatting +232 prefix
const formatPhoneForSave = (raw: string) => {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const cleaned = trimmed.replace(/[^\d+]/g, "")
  if (!cleaned) return null
  if (cleaned.startsWith("+232")) return cleaned
  if (cleaned.startsWith("232")) return `+${cleaned}`
  if (cleaned.startsWith("0")) return `+232${cleaned.slice(1)}`
  return `+232${cleaned}`
}

const formatPhoneForInput = (phone?: string | null) => {
  if (!phone) return ""
  let p = phone.trim()
  if (p.startsWith("+232")) return p.slice(4).trim()
  if (p.startsWith("232")) return p.slice(3).trim()
  return p
}

export function CampMembersClient({ userRole }: { userRole: string }) {
  const [members, setMembers] = useState<CampMember[]>([])
  const [groups, setGroups] = useState<CampGroup[]>([])
  const [branches, setBranches] = useState<CampBranch[]>([])
  const [rooms, setRooms] = useState<CampRoom[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [branchFilter, setBranchFilter] = useState("ALL")
  const [groupFilter, setGroupFilter] = useState("ALL")
  const [roomFilter, setRoomFilter] = useState("ALL")
  const [genderFilter, setGenderFilter] = useState("ALL")
  const [paidFilter, setPaidFilter] = useState("ALL")

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<CampMember | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    gender: "Male",
    branch: "",
    caregroup: "",
    room: "", // Empty string means "AUTO" (random room assignment)
    position: "Member",
    paid: false,
  })

  // Fetch data from database
  const fetchData = async () => {
    try {
      setLoading(true)
      const [membersRes, groupsRes, branchesRes, roomsRes] = await Promise.all([
        fetch("/api/camp/members"),
        fetch("/api/camp/groups"),
        fetch("/api/camp/branches"),
        fetch("/api/camp/rooms"),
      ])

      const [membersData, groupsData, branchesData, roomsData] = await Promise.all([
        membersRes.json(),
        groupsRes.json(),
        branchesRes.json(),
        roomsRes.json(),
      ])

      if (membersData.success) setMembers(membersData.data)
      if (groupsData.success) setGroups(groupsData.data)
      if (branchesData.success) setBranches(branchesData.data)
      if (roomsData.success) setRooms(roomsData.data)
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load camp data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Gender-filtered rooms for Add/Edit Modal
  const availableRoomsForGender = useMemo(() => {
    return rooms.filter(
      (r) => r.gender.toLowerCase() === (formData.gender || "Male").toLowerCase()
    )
  }, [rooms, formData.gender])

  // Handle Gender Change in Modal: Auto-reset room if current selection doesn't match new gender
  const handleGenderChange = (newGender: string) => {
    const matchingRoom = rooms.find(
      (r) => r.name === formData.room && r.gender.toLowerCase() === newGender.toLowerCase()
    )
    setFormData({
      ...formData,
      gender: newGender,
      room: matchingRoom ? matchingRoom.name : "", // Default back to Random Auto-Assign
    })
  }

  // Metrics
  const metrics = useMemo(() => {
    const total = members.length
    const paidCount = members.filter((m) => m.paid).length
    const groupsCount = members.filter((m) => m.caregroup).length
    const roomsCount = members.filter((m) => m.room).length
    const unpaidCount = total - paidCount

    return { total, paidCount, groupsCount, roomsCount, unpaidCount }
  }, [members])

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = m.fullName.toLowerCase().includes(q)
        const matchPhone = (m.phone || "").toLowerCase().includes(q)
        const matchBadge = m.badgeId.toLowerCase().includes(q)
        if (!matchName && !matchPhone && !matchBadge) return false
      }

      if (branchFilter !== "ALL" && m.branch !== branchFilter) return false
      if (groupFilter !== "ALL" && m.caregroup !== groupFilter) return false
      if (roomFilter !== "ALL" && m.room !== roomFilter) return false
      if (genderFilter !== "ALL" && m.gender !== genderFilter) return false
      if (paidFilter !== "ALL") {
        const isPaid = paidFilter === "PAID"
        if (m.paid !== isPaid) return false
      }

      return true
    })
  }, [members, search, branchFilter, groupFilter, roomFilter, genderFilter, paidFilter])

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullName.trim()) {
      toast.error("Please provide attendee name")
      return
    }

    try {
      setSubmitting(true)
      const formattedPayload = {
        ...formData,
        phone: formatPhoneForSave(formData.phone),
        // If room is empty or "AUTO", backend will randomly assign an eligible gender room
        room: formData.room === "AUTO" ? "" : formData.room,
      }

      const res = await fetch("/api/camp/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedPayload),
      })
      const data = await res.json()

      if (data.success) {
        const assignedRoomMsg = data.data.room ? ` • Room: ${data.data.room}` : ""
        toast.success(`Registered ${data.data.fullName} (${data.data.badgeId})${assignedRoomMsg}`)
        setAddModalOpen(false)
        setFormData({
          fullName: "",
          phone: "",
          gender: "Male",
          branch: branches.length > 0 ? branches[0].name : "",
          caregroup: "",
          room: "",
          position: "Member",
          paid: false,
        })
        fetchData()
      } else {
        toast.error(data.error || "Failed to add attendee")
      }
    } catch (err: any) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // Edit Member
  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember) return

    try {
      setSubmitting(true)
      const formattedPayload = {
        ...formData,
        phone: formatPhoneForSave(formData.phone),
        room: formData.room === "NONE" ? null : formData.room === "AUTO" ? "" : formData.room,
      }

      const res = await fetch(`/api/camp/members/${selectedMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedPayload),
      })
      const data = await res.json()

      if (data.success) {
        toast.success("Attendee details updated")
        setEditModalOpen(false)
        fetchData()
      } else {
        toast.error(data.error || "Failed to update attendee")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Member
  const handleDeleteMember = async () => {
    if (!selectedMember) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/camp/members/${selectedMember.id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (data.success) {
        toast.success("Attendee removed")
        setDeleteModalOpen(false)
        fetchData()
      } else {
        toast.error(data.error || "Failed to delete attendee")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // Auto assign groups
  const handleAutoAssignGroups = async () => {
    try {
      toast.info("Distributing attendees across groups...")
      const res = await fetch("/api/camp/auto-assign-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceAll: false }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(data.message)
        fetchData()
      } else {
        toast.error(data.error || "Failed to distribute groups")
      }
    } catch (err) {
      toast.error("Failed to auto-assign")
    }
  }

  // Auto assign rooms randomly by gender
  const handleAutoAssignRooms = async () => {
    try {
      toast.info("Randomly distributing attendees across gender-separated lodging rooms...")
      const res = await fetch("/api/camp/auto-assign-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceAll: false }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(data.message)
        fetchData()
      } else {
        toast.error(data.error || "Failed to auto-assign rooms")
      }
    } catch (err) {
      toast.error("Failed to auto-assign rooms")
    }
  }

  // Confirm all payments
  const handleConfirmAllPayments = async () => {
    try {
      toast.info("Confirming all pending payments...")
      const res = await fetch("/api/camp/confirm-all-payments", {
        method: "POST",
      })
      const data = await res.json()

      if (data.success) {
        toast.success(data.message)
        fetchData()
      } else {
        toast.error(data.error || "Failed to confirm payments")
      }
    } catch (err) {
      toast.error("Failed to confirm payments")
    }
  }

  // Open Edit Modal
  const openEdit = (member: CampMember) => {
    setSelectedMember(member)
    const pos = member.position === "Leader" ? "Leader" : "Member"

    setFormData({
      fullName: member.fullName,
      phone: formatPhoneForInput(member.phone),
      gender: member.gender,
      branch: member.branch || (branches.length > 0 ? branches[0].name : ""),
      caregroup: member.caregroup || "",
      room: member.room || "NONE",
      position: pos,
      paid: member.paid,
    })
    setEditModalOpen(true)
  }

  // Open Tag Preview Modal
  const openTag = (member: CampMember) => {
    setSelectedMember(member)
    setTagDialogOpen(true)
  }

  // Direct 1-Click Download of Badge PDF (no preview needed)
  const handleDirectDownloadTag = (member: CampMember) => {
    toast.success(`Downloading badge for ${member.fullName}...`)
    const target = member.id || member.badgeId
    const downloadUrl = `/api/camp/badge/${target}`

    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = `${(member.fullName || "Attendee").replace(/\s+/g, "_")}_MOR_Badge_${member.badgeId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              MOR Camp 2026
            </span>
            <span className="text-xs text-muted-foreground">That I May Know Him</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-foreground">
            Attendees & Badge Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage camp registrations, groups, lodging allocations, and downloadable tags.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            className="gap-2 font-medium"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {metrics.unpaidCount > 0 && (
            <Button
              variant="outline"
              className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 gap-1.5"
              onClick={handleConfirmAllPayments}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Confirm {metrics.unpaidCount} Payments
            </Button>
          )}

          <Button
            variant="outline"
            className="gap-2 border-primary/30 text-primary hover:bg-primary/10 font-medium"
            onClick={handleAutoAssignGroups}
          >
            <Shuffle className="w-4 h-4" />
            Auto-Assign Groups
          </Button>

          <Button
            variant="outline"
            className="gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 font-medium"
            onClick={handleAutoAssignRooms}
          >
            <BedDouble className="w-4 h-4" />
            Auto-Assign Rooms
          </Button>

          <Link href="/camp/print-tags">
            <Button variant="secondary" className="gap-2">
              <Printer className="w-4 h-4" />
              Print All Tags
            </Button>
          </Link>

          <Button
            className="bg-primary text-white hover:bg-primary/90 gap-2 font-semibold shadow-md"
            onClick={() => {
              setFormData({
                fullName: "",
                phone: "",
                gender: "Male",
                branch: branches.length > 0 ? branches[0].name : "",
                caregroup: "",
                room: "", // Defaults to Auto-Assign
                position: "Member",
                paid: false,
              })
              setAddModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4" />
            Add Attendee
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border shadow-sm bg-card hover:border-primary/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Attendees
            </CardTitle>
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{metrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered for Camp 2026</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card hover:border-emerald-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid (NLe 300)
            </CardTitle>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600">
              {metrics.paidCount}
              <span className="text-xs text-muted-foreground font-normal ml-1.5">
                ({metrics.total ? Math.round((metrics.paidCount / metrics.total) * 100) : 0}%)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.unpaidCount} pending payment
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card hover:border-purple-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Group Assigned
            </CardTitle>
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-purple-600">
              {metrics.groupsCount}
              <span className="text-xs text-muted-foreground font-normal ml-1.5">
                / {metrics.total}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across active groups</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card hover:border-amber-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lodgings Allocated
            </CardTitle>
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <BedDouble className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600">
              {metrics.roomsCount}
              <span className="text-xs text-muted-foreground font-normal ml-1.5">
                / {metrics.total}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Allocated to rooms</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or badge ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
            {/* Dynamic Branch Filter from DB */}
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.name}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Group Filter */}
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Groups</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.name}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Room Filter */}
            <Select value={roomFilter} onValueChange={setRoomFilter}>
              <SelectTrigger className="w-[130px] bg-background">
                <SelectValue placeholder="Room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Rooms</SelectItem>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name} ({r.gender})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Gender Filter */}
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-[120px] bg-background">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>

            {/* Paid Filter */}
            <Select value={paidFilter} onValueChange={setPaidFilter}>
              <SelectTrigger className="w-[120px] bg-background">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PAID">Paid Only</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Attendee Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[110px]">Badge ID</TableHead>
                <TableHead>Attendee Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading attendees...
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No camp attendees found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow
                    key={member.id}
                    className="hover:bg-muted/50 cursor-pointer transition-colors group"
                    onClick={() => openTag(member)}
                    title="Click to view full attendee details & download tag"
                  >
                    <TableCell className="font-mono font-bold text-xs text-primary group-hover:underline">
                      {member.badgeId}
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {member.fullName}
                      </div>
                      {member.phone && (
                        <div className="text-xs text-muted-foreground">{member.phone}</div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          member.gender === "Male"
                            ? "bg-blue-500/10 text-blue-600 border-blue-200"
                            : "bg-pink-500/10 text-pink-600 border-pink-200"
                        }
                      >
                        {member.gender}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-sm font-semibold text-foreground">
                      {member.branch || "—"}
                    </TableCell>

                    <TableCell>
                      {member.caregroup ? (
                        <Badge
                          variant="secondary"
                          className="bg-purple-500/10 text-purple-700 font-semibold"
                        >
                          {member.caregroup}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {member.room ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-700 border-amber-300 font-medium"
                        >
                          {member.room}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No Room</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          member.position === "Leader"
                            ? "bg-amber-500/15 text-amber-700 border-amber-300 font-bold"
                            : "font-medium text-xs"
                        }
                      >
                        {member.position || "Member"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {member.paid ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Paid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-500 border-red-200 gap-1">
                            <Clock className="w-3 h-3" /> Unpaid
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 bg-slate-900 border-slate-700 text-slate-200 hover:bg-primary/20 hover:border-primary/40 hover:text-primary gap-1 shadow-sm transition-colors"
                          title={`Download badge PDF for ${member.fullName}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDirectDownloadTag(member)
                          }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-semibold">Tag</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add Attendee Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-lg bg-card sm:p-6 p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-bold">Register Camp Attendee</DialogTitle>
            <DialogDescription>
              Add a new delegate for MOR Camp 2026. Rooms are filtered by gender with automatic random allocation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMember} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Full Name *
              </Label>
              <Input
                id="fullName"
                placeholder="e.g. John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="h-10"
              />
            </div>

            {/* Row 1: Phone & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Phone / WhatsApp
                  </Label>
                  <span className="text-[10px] text-muted-foreground">(Optional)</span>
                </div>
                <div className="flex rounded-lg border border-input focus-within:ring-2 focus-within:ring-primary/20 overflow-hidden bg-background h-10">
                  <span className="inline-flex items-center px-2.5 text-xs font-bold text-muted-foreground bg-muted/60 border-r border-input select-none">
                    +232
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="76 123 456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-full text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gender" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Gender
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={handleGenderChange}
                >
                  <SelectTrigger id="gender" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">🚹 Male</SelectItem>
                    <SelectItem value="Female">🚺 Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Branch & Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="branch" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sending Branch
                </Label>
                <Select
                  value={formData.branch}
                  onValueChange={(val) => setFormData({ ...formData, branch: val })}
                >
                  <SelectTrigger id="branch" className="h-10 w-full truncate">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="caregroup" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Camp Group
                </Label>
                <Select
                  value={formData.caregroup}
                  onValueChange={(val) => setFormData({ ...formData, caregroup: val })}
                >
                  <SelectTrigger id="caregroup" className="h-10 w-full truncate">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.name}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Lodging Room & Position */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="room" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Lodging Room ({formData.gender})
                </Label>
                <Select
                  value={formData.room || "AUTO"}
                  onValueChange={(val) =>
                    setFormData({ ...formData, room: val === "AUTO" ? "" : val })
                  }
                >
                  <SelectTrigger id="room" className="h-10 w-full min-w-0 overflow-hidden text-left truncate">
                    <SelectValue placeholder="Random / Select Room" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="AUTO" className="font-semibold text-primary">
                      ✨ Auto-Assign (Random {formData.gender} Room)
                    </SelectItem>
                    {availableRoomsForGender.map((r) => (
                      <SelectItem
                        key={r.id}
                        value={r.name}
                        disabled={r.available <= 0}
                      >
                        {r.name} ({r.occupied}/{r.capacity}) {r.available <= 0 ? "— Full" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="position" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Position / Role
                </Label>
                <Select
                  value={formData.position}
                  onValueChange={(val) => setFormData({ ...formData, position: val })}
                >
                  <SelectTrigger id="position" className="h-10 w-full min-w-0 text-left">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="Leader">Leader</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Checkbox Card */}
            <div className="p-3 bg-muted/40 rounded-xl border flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="paid" className="cursor-pointer font-semibold text-sm text-foreground block">
                  Confirmed Paid (NLe 300)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Mark camp registration fee as fully paid
                </p>
              </div>
              <input
                type="checkbox"
                id="paid"
                checked={formData.paid}
                onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary w-5 h-5 cursor-pointer"
              />
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white" disabled={submitting}>
                {submitting ? "Registering..." : "Save Attendee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Attendee Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg bg-card sm:p-6 p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-bold">
              Edit Attendee ({selectedMember?.badgeId})
            </DialogTitle>
            <DialogDescription>
              Update delegate details, lodging assignment, or payment status.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditMember} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="editFullName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Full Name *
              </Label>
              <Input
                id="editFullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="h-10"
              />
            </div>

            {/* Row 1: Phone & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="editPhone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Phone / WhatsApp
                  </Label>
                  <span className="text-[10px] text-muted-foreground">(Optional)</span>
                </div>
                <div className="flex rounded-lg border border-input focus-within:ring-2 focus-within:ring-primary/20 overflow-hidden bg-background h-10">
                  <span className="inline-flex items-center px-2.5 text-xs font-bold text-muted-foreground bg-muted/60 border-r border-input select-none">
                    +232
                  </span>
                  <Input
                    id="editPhone"
                    type="tel"
                    placeholder="76 123 456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-full text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editGender" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Gender
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={handleGenderChange}
                >
                  <SelectTrigger id="editGender" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">🚹 Male</SelectItem>
                    <SelectItem value="Female">🚺 Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Branch & Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="editBranch" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sending Branch
                </Label>
                <Select
                  value={formData.branch}
                  onValueChange={(val) => setFormData({ ...formData, branch: val })}
                >
                  <SelectTrigger id="editBranch" className="h-10 w-full truncate">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editCaregroup" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Camp Group
                </Label>
                <Select
                  value={formData.caregroup}
                  onValueChange={(val) => setFormData({ ...formData, caregroup: val })}
                >
                  <SelectTrigger id="editCaregroup" className="h-10 w-full truncate">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.name}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Lodging Room & Position */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="editRoom" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Lodging Room ({formData.gender})
                </Label>
                <Select
                  value={formData.room || "NONE"}
                  onValueChange={(val) => setFormData({ ...formData, room: val })}
                >
                  <SelectTrigger id="editRoom" className="h-10 w-full min-w-0 overflow-hidden text-left truncate">
                    <SelectValue placeholder="Assign room" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="NONE">-- Unassigned (No Room) --</SelectItem>
                    <SelectItem value="AUTO" className="font-semibold text-primary">
                      ✨ Auto-Assign (Random {formData.gender} Room)
                    </SelectItem>
                    {availableRoomsForGender.map((r) => (
                      <SelectItem key={r.id} value={r.name}>
                        {r.name} ({r.occupied}/{r.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="editPosition" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Position / Role
                </Label>
                <Select
                  value={formData.position}
                  onValueChange={(val) => setFormData({ ...formData, position: val })}
                >
                  <SelectTrigger id="editPosition" className="h-10 w-full min-w-0 text-left">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="Leader">Leader</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Checkbox Card */}
            <div className="p-3 bg-muted/40 rounded-xl border flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="editPaid" className="cursor-pointer font-semibold text-sm text-foreground block">
                  Confirmed Paid (NLe 300)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Mark camp registration fee as fully paid
                </p>
              </div>
              <input
                type="checkbox"
                id="editPaid"
                checked={formData.paid}
                onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary w-5 h-5 cursor-pointer"
              />
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white" disabled={submitting}>
                {submitting ? "Saving..." : "Update Attendee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Remove Attendee
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <strong className="text-foreground">{selectedMember?.fullName}</strong> (
              {selectedMember?.badgeId}) from MOR Camp 2026? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteMember}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Badge Tag Preview, Full Profile & Download Modal */}
      <MorTagDialog
        open={tagDialogOpen}
        onOpenChange={setTagDialogOpen}
        member={selectedMember}
        onEdit={openEdit}
        onDelete={(m) => {
          setSelectedMember(m)
          setDeleteModalOpen(true)
        }}
      />
    </div>
  )
}
