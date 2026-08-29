"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  Users,
  Sparkles,
  Printer,
  Plus,
  FileSpreadsheet,
  Building,
  CheckCircle2,
  Phone,
  UserX,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CalendarDays,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CampBulkImportDialog } from "@/components/camp/camp-bulk-import-dialog"
import { downloadAttendeeBadge } from "@/lib/campBadgeHelper"
import { toast } from "sonner"
import { ROUTES } from "@/lib/constants"

export interface CampDashboardData {
  stats: {
    totalAttendees: number
    maleAttendees: number
    femaleAttendees: number
    totalLeaders: number
    totalRooms: number
    maleRooms: number
    femaleRooms: number
    roomsWithLeaders: number
    totalGroups: number
    groupsWithLeaders: number
    totalCheckins: number
    totalBranches: number
  }
  flaggedAbsentMembers?: Array<{
    id: string
    badgeId: string
    fullName: string
    phone: string | null
    branch: string | null
    caregroup: string | null
    position: string
    gender: string
  }>
  recentAttendees: Array<{
    id: string
    badgeId: string
    fullName: string
    gender: string
    phone: string | null
    branch: string | null
    caregroup: string | null
    room: string | null
    position: string
    createdAt: string
  }>
  branchBreakdown: Array<{
    branch: string
    count: number
    percentage: number
  }>
  groupBreakdown: Array<{
    id: string
    name: string
    leader: string | null
    color: string | null
    memberCount: number
  }>
  roomBreakdown: Array<{
    id: string
    name: string
    gender: string
    leader: string | null
    assistant: string | null
    occupied: number
  }>
}

export function CampDashboardClient({
  data,
  currentUserRole,
}: {
  data: CampDashboardData
  currentUserRole: string
}) {
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [absentSearch, setAbsentSearch] = useState("")
  const [absentBranchFilter, setAbsentBranchFilter] = useState("ALL")

  const { stats, recentAttendees, branchBreakdown, groupBreakdown, flaggedAbsentMembers = [] } = data

  const handleDownloadTag = (attendee: any) => {
    toast.success(`Generating badge for ${attendee.fullName}...`)
    downloadAttendeeBadge({
      fullName: attendee.fullName,
      badgeId: attendee.badgeId,
      branch: attendee.branch || "",
      caregroup: attendee.caregroup || "",
      room: attendee.room || "",
      position: attendee.position || "Member",
    })
  }

  // Filter flagged absent members
  const filteredAbsent = flaggedAbsentMembers.filter((m) => {
    if (absentBranchFilter !== "ALL" && (m.branch || "Unspecified") !== absentBranchFilter) {
      return false
    }
    if (absentSearch.trim()) {
      const q = absentSearch.toLowerCase().trim()
      const matchName = m.fullName.toLowerCase().includes(q)
      const matchBadge = m.badgeId.toLowerCase().includes(q)
      const matchPhone = (m.phone || "").toLowerCase().includes(q)
      if (!matchName && !matchBadge && !matchPhone) return false
    }
    return true
  })

  return (
    <div className="w-full max-w-full space-y-6 sm:space-y-8 pb-20 sm:pb-16 overflow-x-hidden">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-primary/95 to-slate-950 p-5 sm:p-8 text-white shadow-xl border border-primary/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Ministry of Reconciliation
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                CAMP OPERATIONS LIVE
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-sm">
              MOR CAMP 2026
            </h1>

            <p className="text-slate-200 text-sm sm:text-base font-medium">
              Theme: <span className="text-amber-300 font-bold">&quot;That I May Know Him&quot;</span> • Philippians 3:10
            </p>
            <p className="text-xs sm:text-sm text-slate-300">
              Executive Command Center for attendee registrations, attendance tracking, and ministry fellowship groups.
            </p>
          </div>

          {/* Quick Hero Actions */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            <Link href={ROUTES.CAMP_ATTENDANCE}>
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black gap-2 shadow-lg h-10 px-4">
                <CheckCircle2 className="w-4 h-4" />
                Live Check-In Desk
              </Button>
            </Link>

            <Link href={ROUTES.CAMP_ANALYSIS}>
              <Button className="bg-purple-500 hover:bg-purple-400 text-white font-black gap-2 shadow-lg h-10 px-4">
                <Sparkles className="w-4 h-4" />
                Group Analysis Radar
              </Button>
            </Link>

            <Link href="/camp/members">
              <Button className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold gap-2 shadow-lg h-10">
                <Plus className="w-4 h-4" />
                Add Attendee
              </Button>
            </Link>

            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold gap-2 backdrop-blur-sm h-10"
              onClick={() => setBulkImportOpen(true)}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Bulk Import
            </Button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SPECIAL PLACE FOR ABSENT MEMBERS (FLAGGED AT THE FRONT) */}
      {/* ======================================================== */}
      <Card className="w-full border-2 border-red-500/40 shadow-lg bg-gradient-to-br from-red-500/5 via-card to-card rounded-2xl overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-3 border-b border-red-500/20 bg-red-500/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/20 text-red-600 rounded-xl flex-shrink-0">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg sm:text-xl font-black text-foreground">
                    Flagged Absent Members ({flaggedAbsentMembers.length})
                  </CardTitle>
                  <Badge className="bg-red-600 text-white font-black text-[10px] uppercase">
                    Requires Immediate Follow-up
                  </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Delegates currently marked absent for the active camp session. Tap call to follow up.
                </CardDescription>
              </div>
            </div>

            <Link href={ROUTES.CAMP_ATTENDANCE}>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 rounded-xl shadow gap-1.5"
              >
                <span>Go to Check-In Desk</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Quick Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <input
                placeholder="Search absent members by name or badge..."
                value={absentSearch}
                onChange={(e) => setAbsentSearch(e.target.value)}
                className="w-full h-9 pl-3 pr-8 text-xs font-semibold bg-background border border-border rounded-xl"
              />
              {absentSearch && (
                <button
                  onClick={() => setAbsentSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={absentBranchFilter}
                onChange={(e) => setAbsentBranchFilter(e.target.value)}
                className="h-9 px-3 text-xs font-semibold bg-background border border-border rounded-xl"
              >
                <option value="ALL">All Branches</option>
                {branchBreakdown.map((b) => (
                  <option key={b.branch} value={b.branch}>
                    {b.branch} ({b.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Absent Delegates Grid */}
          {filteredAbsent.length === 0 ? (
            <div className="p-8 text-center bg-card rounded-xl border border-dashed text-xs text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              <div className="font-bold text-foreground">No absent delegates match this query.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {filteredAbsent.map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-background border border-red-500/30 rounded-xl flex flex-col justify-between gap-2.5 hover:border-red-500/60 transition-all shadow-sm"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-black text-xs text-primary">
                        {m.badgeId}
                      </span>
                      <span className="text-[10px] font-black uppercase text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded">
                        ABSENT
                      </span>
                    </div>
                    <div className="font-black text-sm text-foreground truncate">
                      {m.fullName}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
                      <span>{m.branch || "HQ"}</span>
                      <span>•</span>
                      <span className="text-purple-600 font-semibold truncate">{m.caregroup || "Unassigned"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                    {m.phone ? (
                      <a
                        href={`tel:${m.phone}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call {m.phone}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">No phone listed</span>
                    )}

                    <Link href={ROUTES.CAMP_ATTENDANCE}>
                      <span className="text-xs font-bold text-emerald-600 hover:underline">
                        Check In ➔
                      </span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Executive Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Attendees */}
        <Card className="border shadow-sm bg-card hover:border-primary/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Registered Delegates
            </CardTitle>
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{stats.totalAttendees}</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span className="text-blue-600 font-semibold">{stats.maleAttendees} Male</span>
              <span>•</span>
              <span className="text-pink-600 font-semibold">{stats.femaleAttendees} Female</span>
              {stats.totalLeaders > 0 && (
                <>
                  <span>•</span>
                  <span className="text-purple-600 font-semibold">{stats.totalLeaders} Leaders</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Camp Groups */}
        <Card className="border shadow-sm bg-card hover:border-purple-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Camp Ministry Groups
            </CardTitle>
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-purple-600">{stats.totalGroups} Groups</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>Balanced distribution</span>
              <span>•</span>
              <span className="text-purple-700 dark:text-purple-400 font-semibold">
                {stats.groupsWithLeaders} Leaders assigned
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Sending Branches */}
        <Card className="border shadow-sm bg-card hover:border-emerald-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Sending Branches
            </CardTitle>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">{stats.totalBranches} Branches</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>Headquarters • Bo • Eastern</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fellowship Groups Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Camp Fellowship Groups</h2>
            <p className="text-xs text-muted-foreground">Real-time attendance and membership across ministry teams</p>
          </div>
          <Link href="/camp/groups">
            <Button variant="ghost" size="sm" className="gap-1 text-xs font-bold text-primary">
              View Groups <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {groupBreakdown.map((group) => (
            <Card key={group.id} className="border shadow-sm bg-card hover:shadow-md transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-1">
                  <CardTitle className="text-sm font-bold text-foreground truncate">{group.name}</CardTitle>
                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 text-[10px] font-bold">
                    {group.memberCount}
                  </Badge>
                </div>
                <CardDescription className="text-[11px] truncate">
                  Leader: <span className="font-semibold text-foreground">{group.leader || "Unassigned"}</span>
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Bulk Import Modal */}
      <CampBulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        onSuccess={() => window.location.reload()}
      />
    </div>
  )
}
