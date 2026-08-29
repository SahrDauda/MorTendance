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
  BedDouble,
  Users,
  Plus,
  Edit2,
  Trash2,
  UserX,
  UserPlus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shuffle,
  Download,
  ShieldCheck,
} from "lucide-react"
import {
  downloadSingleRoomRosterPDF,
  downloadAllRoomsRosterPDF,
} from "@/lib/campRoomRosterPDF"

interface RoomOccupant {
  id: string
  badgeId: string
  fullName: string
  gender: string
  phone: string | null
  branch: string | null
  caregroup: string | null
  position: string
}

interface CampRoom {
  id: string
  name: string
  gender: string
  capacity: number
  leader?: string | null
  assistant?: string | null
  notes: string | null
  occupied: number
  available: number
  occupants: RoomOccupant[]
}

interface UnassignedMember {
  id: string
  badgeId: string
  fullName: string
  gender: string
  branch: string | null
  caregroup: string | null
}

export function CampRoomsClient({ userRole }: { userRole: string }) {
  const [rooms, setRooms] = useState<CampRoom[]>([])
  const [allMembers, setAllMembers] = useState<RoomOccupant[]>([])
  const [unassignedMembers, setUnassignedMembers] = useState<UnassignedMember[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [genderFilter, setGenderFilter] = useState("ALL")

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [lodgerModalOpen, setLodgerModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<CampRoom | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    gender: "Male",
    capacity: 30,
    leader: "",
    assistant: "",
    notes: "",
  })
  const [selectedMemberToAssign, setSelectedMemberToAssign] = useState("")

  const fetchData = async () => {
    try {
      setLoading(true)
      const [roomsRes, membersRes] = await Promise.all([
        fetch("/api/camp/rooms"),
        fetch("/api/camp/members?room=ALL"),
      ])

      const [roomsData, membersData] = await Promise.all([
        roomsRes.json(),
        membersRes.json(),
      ])

      if (roomsData.success) setRooms(roomsData.data)
      if (membersData.success) {
        setAllMembers(membersData.data)
        const unassigned = membersData.data.filter((m: any) => !m.room)
        setUnassignedMembers(unassigned)
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load lodging data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Eligible members for Head of Room & Assistant matching selected room gender
  const eligibleMembersForRoom = useMemo(() => {
    return allMembers.filter((m) => m.gender === formData.gender)
  }, [allMembers, formData.gender])

  // Metrics
  const metrics = useMemo(() => {
    const totalRooms = rooms.length
    const maleRoomsCount = rooms.filter((r) => r.gender === "Male").length
    const femaleRoomsCount = rooms.filter((r) => r.gender === "Female").length
    const totalOccupants = rooms.reduce((acc, r) => acc + r.occupied, 0)
    const roomsWithLeaders = rooms.filter((r) => r.leader).length

    return {
      totalRooms,
      maleRoomsCount,
      femaleRoomsCount,
      totalOccupants,
      roomsWithLeaders,
    }
  }, [rooms])

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = r.name.toLowerCase().includes(q)
        const matchOccupant = r.occupants.some((o) =>
          o.fullName.toLowerCase().includes(q) || o.badgeId.toLowerCase().includes(q)
        )
        if (!matchName && !matchOccupant) return false
      }

      if (genderFilter !== "ALL" && r.gender !== genderFilter) return false

      return true
    })
  }, [rooms, search, genderFilter])

  // Add Room
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error("Room name is required")
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch("/api/camp/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`Created room "${data.data.name}"`)
        setAddModalOpen(false)
        setFormData({ name: "", gender: "Male", capacity: 30, leader: "", assistant: "", notes: "" })
        fetchData()
      } else {
        toast.error(data.error || "Failed to create room")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // Edit Room
  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRoom) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/camp/rooms/${selectedRoom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (data.success) {
        toast.success("Room details updated")
        setEditModalOpen(false)
        fetchData()
      } else {
        toast.error(data.error || "Failed to update room")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Room
  const handleDeleteRoom = async () => {
    if (!selectedRoom) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/camp/rooms/${selectedRoom.id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (data.success) {
        toast.success("Room deleted and occupants unassigned")
        setDeleteModalOpen(false)
        fetchData()
      } else {
        toast.error(data.error || "Failed to delete room")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // Assign member to room
  const handleAssignMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRoom || !selectedMemberToAssign) {
      toast.error("Please select an attendee")
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch("/api/camp/rooms/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMemberToAssign,
          roomName: selectedRoom.name,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`Assigned attendee to ${selectedRoom.name}`)
        setAssignModalOpen(false)
        setSelectedMemberToAssign("")
        fetchData()
      } else {
        toast.error(data.error || "Failed to assign attendee")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // Unassign member from room
  const handleUnassignMember = async (memberId: string) => {
    try {
      const res = await fetch("/api/camp/rooms/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          roomName: null,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success("Attendee unassigned from room")
        fetchData()
        if (selectedRoom) {
          setSelectedRoom({
            ...selectedRoom,
            occupied: selectedRoom.occupied - 1,
            available: selectedRoom.available + 1,
            occupants: selectedRoom.occupants.filter((o) => o.id !== memberId),
          })
        }
      } else {
        toast.error(data.error || "Failed to unassign")
      }
    } catch (err) {
      toast.error("An error occurred")
    }
  }

  // Open Edit Modal
  const openEdit = (room: CampRoom) => {
    setSelectedRoom(room)
    setFormData({
      name: room.name,
      gender: room.gender,
      capacity: room.capacity,
      leader: room.leader || "",
      assistant: room.assistant || "",
      notes: room.notes || "",
    })
    setEditModalOpen(true)
  }

  // Open Lodgers Modal
  const openLodgers = (room: CampRoom) => {
    setSelectedRoom(room)
    setLodgerModalOpen(true)
  }

  // Open Quick Assign Modal
  const openQuickAssign = (room: CampRoom) => {
    setSelectedRoom(room)
    setSelectedMemberToAssign("")
    setAssignModalOpen(true)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              MOR Camp Lodgings
            </span>
            <span className="text-xs text-muted-foreground">Mercy Prayer Mountain</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-foreground">
            Rooms & Lodging Allocations
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage hostel accommodation blocks, capacity limits, and attendee bed allocations.
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

          <Button
            variant="secondary"
            className="gap-2 font-medium"
            onClick={() => {
              toast.info("Exporting master room rosters PDF...")
              downloadAllRoomsRosterPDF(rooms)
            }}
          >
            <Download className="w-4 h-4 text-teal-600" />
            Download All Rosters (PDF)
          </Button>

          <Button
            className="bg-primary text-white hover:bg-primary/90 gap-2 font-semibold shadow-md"
            onClick={() => {
              setFormData({ name: "", gender: "Male", capacity: 30, leader: "", assistant: "", notes: "" })
              setAddModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4" />
            Add Room
          </Button>
        </div>
      </div>

      {/* Unassigned Warning Banner */}
      {unassignedMembers.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-600 flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">
                {unassignedMembers.length} Attendees currently without lodging rooms
              </div>
              <div className="text-xs text-muted-foreground">
                Assign delegates to rooms individually in the Attendees directory or room rosters.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border shadow-sm bg-card hover:border-primary/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Rooms
            </CardTitle>
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
              <BedDouble className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{metrics.totalRooms}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.maleRoomsCount} Male • {metrics.femaleRoomsCount} Female
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card hover:border-emerald-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Allocated Delegates
            </CardTitle>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600">
              {metrics.totalOccupants}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Delegates assigned to rooms
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card hover:border-amber-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Allocation
            </CardTitle>
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600">
              {unassignedMembers.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Attendees awaiting rooms
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card hover:border-purple-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Room Leadership
            </CardTitle>
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-purple-600">
              {metrics.roomsWithLeaders}
              <span className="text-xs text-muted-foreground font-normal ml-1.5">
                / {metrics.totalRooms}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rooms with Head assigned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by room name or occupant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Genders</SelectItem>
                <SelectItem value="Male">Male Rooms</SelectItem>
                <SelectItem value="Female">Female Rooms</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-primary" />
            Loading rooms...
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            <BedDouble className="w-10 h-10 mx-auto mb-2 opacity-30" />
            No rooms found. Click &quot;Add Room&quot; to configure lodging blocks.
          </div>
        ) : (
          filteredRooms.map((room) => {
            return (
              <Card
                key={room.id}
                className="border shadow-sm transition-all flex flex-col justify-between bg-card hover:shadow-md hover:border-primary/40"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold text-foreground">
                          {room.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={
                            room.gender === "Male"
                              ? "bg-blue-500/10 text-blue-600 border-blue-200"
                              : "bg-pink-500/10 text-pink-600 border-pink-200"
                          }
                        >
                          {room.gender}
                        </Badge>
                      </div>
                      {room.notes && (
                        <CardDescription className="text-xs mt-1">
                          {room.notes}
                        </CardDescription>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(room)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10"
                        onClick={() => {
                          setSelectedRoom(room)
                          setDeleteModalOpen(true)
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Allocated Delegates Summary */}
                  <div className="flex items-center justify-between text-xs font-semibold pt-2">
                    <span className="text-muted-foreground">Allocated Members</span>
                    <Badge variant="secondary" className="font-bold text-xs bg-primary/10 text-primary border-primary/20">
                      {room.occupied} Delegates
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  {/* Occupants list snippet */}
                  <div className="bg-muted/40 p-2.5 rounded-xl border space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Occupants ({room.occupants.length})</span>
                    </div>

                    {room.occupants.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic py-1">
                        No attendees assigned yet
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {room.occupants.map((occ) => (
                          <Badge
                            key={occ.id}
                            variant="secondary"
                            className="text-[11px] font-medium bg-background text-foreground border py-0.5"
                          >
                            {occ.fullName.split(" ")[0]}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Head of Room & Assistant Badges */}
                  {(room.leader || room.assistant) && (
                    <div className="bg-muted/30 p-2 rounded-lg border space-y-1 text-xs">
                      {room.leader && (
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold truncate">
                          <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 shrink-0">Head</span>
                          <span className="truncate">{room.leader}</span>
                        </div>
                      )}
                      {room.assistant && (
                        <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400 font-medium truncate">
                          <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 shrink-0">Asst</span>
                          <span className="truncate">{room.assistant}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs px-2 gap-1"
                      onClick={() => openLodgers(room)}
                      title="View all occupants in this room"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>View ({room.occupied})</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs px-2 gap-1 border-slate-700 bg-slate-900 text-slate-100 hover:bg-primary/20 hover:text-primary hover:border-primary/40 font-semibold transition-colors"
                      onClick={() => {
                        toast.info(`Downloading roster PDF for ${room.name}...`)
                        downloadSingleRoomRosterPDF(room)
                      }}
                      title={`Download roster PDF for Room ${room.name}`}
                    >
                      <Download className="w-3.5 h-3.5 text-teal-400" />
                      <span>Roster</span>
                    </Button>

                    <Button
                      size="sm"
                      className="text-xs px-2 gap-1 bg-primary text-white"
                      onClick={() => openQuickAssign(room)}
                      title="Assign an attendee to this room"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Assign</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Add Room Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Lodging Room</DialogTitle>
            <DialogDescription>
              Create a new room block for MOR Camp 2026 accommodation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddRoom} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="roomName">Room Name *</Label>
                <Input
                  id="roomName"
                  placeholder="e.g. Room 1 (Upper Block)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="roomGender">Gender Allocation</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) => setFormData({ ...formData, gender: val, leader: "", assistant: "" })}
                >
                  <SelectTrigger id="roomGender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Head of Room & Assistant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="roomLeader" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Head of Room
                </Label>
                <Select
                  value={formData.leader || "NONE"}
                  onValueChange={(val) =>
                    setFormData({ ...formData, leader: val === "NONE" ? "" : val })
                  }
                >
                  <SelectTrigger id="roomLeader" className="w-full truncate">
                    <SelectValue placeholder="Select Head of Room" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="NONE">-- No Head of Room --</SelectItem>
                    {formData.leader &&
                      !eligibleMembersForRoom.some((m) => m.fullName === formData.leader) && (
                        <SelectItem value={formData.leader}>
                          {formData.leader} (Current)
                        </SelectItem>
                      )}
                    {eligibleMembersForRoom.map((m) => (
                      <SelectItem key={m.id} value={m.fullName}>
                        {m.fullName} ({m.badgeId}{m.branch ? ` • ${m.branch}` : ""})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="roomAssistant" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Assistant Head
                </Label>
                <Select
                  value={formData.assistant || "NONE"}
                  onValueChange={(val) =>
                    setFormData({ ...formData, assistant: val === "NONE" ? "" : val })
                  }
                >
                  <SelectTrigger id="roomAssistant" className="w-full truncate">
                    <SelectValue placeholder="Select Assistant" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="NONE">-- No Assistant --</SelectItem>
                    {formData.assistant &&
                      !eligibleMembersForRoom.some((m) => m.fullName === formData.assistant) && (
                        <SelectItem value={formData.assistant}>
                          {formData.assistant} (Current)
                        </SelectItem>
                      )}
                    {eligibleMembersForRoom.map((m) => (
                      <SelectItem key={m.id} value={m.fullName}>
                        {m.fullName} ({m.badgeId}{m.branch ? ` • ${m.branch}` : ""})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="roomNotes">Notes / Location Details</Label>
              <Input
                id="roomNotes"
                placeholder="e.g. Main Hostel, 2nd Floor"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white" disabled={submitting}>
                {submitting ? "Creating..." : "Save Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Room Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Room</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditRoom} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="editRoomName">Room Name *</Label>
                <Input
                  id="editRoomName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editRoomGender">Gender Allocation</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) => setFormData({ ...formData, gender: val, leader: "", assistant: "" })}
                >
                  <SelectTrigger id="editRoomGender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Head of Room & Assistant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="editRoomLeader" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Head of Room
                </Label>
                <Select
                  value={formData.leader || "NONE"}
                  onValueChange={(val) =>
                    setFormData({ ...formData, leader: val === "NONE" ? "" : val })
                  }
                >
                  <SelectTrigger id="editRoomLeader" className="w-full truncate">
                    <SelectValue placeholder="Select Head of Room" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="NONE">-- No Head of Room --</SelectItem>
                    {formData.leader &&
                      !eligibleMembersForRoom.some((m) => m.fullName === formData.leader) && (
                        <SelectItem value={formData.leader}>
                          {formData.leader} (Current)
                        </SelectItem>
                      )}
                    {eligibleMembersForRoom.map((m) => (
                      <SelectItem key={m.id} value={m.fullName}>
                        {m.fullName} ({m.badgeId}{m.branch ? ` • ${m.branch}` : ""})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editRoomAssistant" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Assistant Head
                </Label>
                <Select
                  value={formData.assistant || "NONE"}
                  onValueChange={(val) =>
                    setFormData({ ...formData, assistant: val === "NONE" ? "" : val })
                  }
                >
                  <SelectTrigger id="editRoomAssistant" className="w-full truncate">
                    <SelectValue placeholder="Select Assistant" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="NONE">-- No Assistant --</SelectItem>
                    {formData.assistant &&
                      !eligibleMembersForRoom.some((m) => m.fullName === formData.assistant) && (
                        <SelectItem value={formData.assistant}>
                          {formData.assistant} (Current)
                        </SelectItem>
                      )}
                    {eligibleMembersForRoom.map((m) => (
                      <SelectItem key={m.id} value={m.fullName}>
                        {m.fullName} ({m.badgeId}{m.branch ? ` • ${m.branch}` : ""})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editRoomNotes">Notes / Location Details</Label>
              <Input
                id="editRoomNotes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white" disabled={submitting}>
                {submitting ? "Saving..." : "Update Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Room Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Room
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete room{" "}
              <strong className="text-foreground">{selectedRoom?.name}</strong>? Any attendees
              currently allocated to this room will be unassigned automatically.
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
              onClick={handleDeleteRoom}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Lodgers Modal */}
      <Dialog open={lodgerModalOpen} onOpenChange={setLodgerModalOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center justify-between">
              <span>{selectedRoom?.name} — Lodgers</span>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {selectedRoom?.occupied} Allocated
              </Badge>
            </DialogTitle>
            <DialogDescription>
              List of attendees allocated to this room. You can unassign attendees below.
            </DialogDescription>

            {(selectedRoom?.leader || selectedRoom?.assistant) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedRoom.leader && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 gap-1.5 py-1 px-2.5 text-xs">
                    <span className="font-black uppercase text-[10px]">Head:</span>
                    <span className="font-semibold">{selectedRoom.leader}</span>
                  </Badge>
                )}
                {selectedRoom.assistant && (
                  <Badge variant="outline" className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-300 gap-1.5 py-1 px-2.5 text-xs">
                    <span className="font-black uppercase text-[10px]">Assistant:</span>
                    <span className="font-semibold">{selectedRoom.assistant}</span>
                  </Badge>
                )}
              </div>
            )}
          </DialogHeader>

          <div className="py-2 space-y-2 max-h-80 overflow-y-auto pr-1">
            {!selectedRoom?.occupants || selectedRoom.occupants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No occupants in this room.
              </div>
            ) : (
              selectedRoom.occupants.map((occ) => (
                <div
                  key={occ.id}
                  className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border"
                >
                  <div>
                    <div className="font-bold text-foreground text-sm">{occ.fullName}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-primary font-semibold">{occ.badgeId}</span>
                      {occ.branch && <span>• {occ.branch}</span>}
                      {occ.caregroup && <span>• Group: {occ.caregroup}</span>}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:bg-red-500/10 text-xs gap-1"
                    onClick={() => handleUnassignMember(occ.id)}
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Unassign
                  </Button>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="pt-3 border-t flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-primary/20 hover:text-primary hover:border-primary/40 font-semibold gap-1.5"
              onClick={() => {
                if (selectedRoom) {
                  toast.info(`Downloading roster PDF for ${selectedRoom.name}...`)
                  downloadSingleRoomRosterPDF(selectedRoom)
                }
              }}
            >
              <Download className="w-4 h-4 text-teal-400" />
              Download Roster PDF
            </Button>

            <Button variant="outline" onClick={() => setLodgerModalOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Assign Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Assign Attendee to {selectedRoom?.name}
            </DialogTitle>
            <DialogDescription>
              Select an unassigned attendee ({selectedRoom?.gender} only) to allocate to this room.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignMember} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="assignSelect">Select Attendee</Label>
              <Select
                value={selectedMemberToAssign}
                onValueChange={setSelectedMemberToAssign}
              >
                <SelectTrigger id="assignSelect">
                  <SelectValue placeholder="Choose an attendee..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {unassignedMembers
                    .filter((m) => !selectedRoom || m.gender === selectedRoom.gender)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.fullName} ({m.badgeId}) — {m.branch || "No Branch"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white" disabled={submitting}>
                {submitting ? "Assigning..." : "Assign to Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
