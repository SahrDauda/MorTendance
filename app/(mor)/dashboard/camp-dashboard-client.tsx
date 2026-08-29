"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  Users,
  BedDouble,
  Sparkles,
  QrCode,
  Printer,
  Plus,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  Download,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CampBulkImportDialog } from "@/components/camp/camp-bulk-import-dialog"
import { downloadAttendeeBadge } from "@/lib/campBadgeHelper"
import { toast } from "sonner"

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
  const { stats, recentAttendees, branchBreakdown, groupBreakdown, roomBreakdown } = data

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

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-primary/95 to-slate-950 p-6 sm:p-8 text-white shadow-xl border border-primary/20">
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

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-sm">
              MOR CAMP 2026
            </h1>

            <p className="text-slate-200 text-sm sm:text-base font-medium">
              Theme: <span className="text-amber-300 font-bold">&quot;That I May Know Him&quot;</span> • Philippians 3:10
            </p>
            <p className="text-xs sm:text-sm text-slate-300">
              Executive Command Center for attendee registrations, hostel lodging allocations, ministry groups, and badges.
            </p>
          </div>

          {/* Quick Hero Actions */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            <Link href="/camp/members">
              <Button className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold gap-2 shadow-lg h-10">
                <Plus className="w-4 h-4" />
                Register Attendee
              </Button>
            </Link>

            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold gap-2 backdrop-blur-sm h-10"
              onClick={() => setBulkImportOpen(true)}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Bulk Import (Excel / PDF)
            </Button>

            <Link href="/camp/print-tags">
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold gap-2 backdrop-blur-sm h-10"
              >
                <Printer className="w-4 h-4 text-cyan-300" />
                Print Badges
              </Button>
            </Link>
          </div>
        </div>
      </div>

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

        {/* Lodging Allocations (Commented out) */}
        {/*
        <Card className="border shadow-sm bg-card hover:border-amber-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Hostel Lodging Rooms
            </CardTitle>
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <BedDouble className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">{stats.totalRooms} Rooms</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{stats.maleRooms} Male</span>
              <span>•</span>
              <span>{stats.femaleRooms} Female</span>
              <span>•</span>
              <span className="text-amber-700 dark:text-amber-400 font-semibold">
                {stats.roomsWithLeaders} Heads assigned
              </span>
            </div>
          </CardContent>
        </Card>
        */}

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

        {/* Live Check-In Attendance */}
        <Card className="border shadow-sm bg-card hover:border-emerald-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Session Check-Ins
            </CardTitle>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">{stats.totalCheckins}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Scanned & logged attendance across camp sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4 Interactive Command Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-foreground tracking-tight">Camp Operation Modules</h2>
          <span className="text-xs text-muted-foreground">Direct access to core modules</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Attendees Module */}
          <Link href="/camp/members" className="group">
            <Card className="h-full border shadow-sm bg-card hover:border-primary transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <CardTitle className="text-base font-bold mt-2 text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Camp Attendees</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" />
                </CardTitle>
                <CardDescription className="text-xs">
                  Register delegates, search by badge ID, view full profile tags, and export rosters.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 text-xs">
                  {stats.totalAttendees} Registered
                </Badge>
              </CardContent>
            </Card>
          </Link>

          {/* Rooms Module (Commented out) */}
          {/*
          <Link href="/camp/rooms" className="group">
            <Card className="h-full border shadow-sm bg-card hover:border-amber-500 transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                  <BedDouble className="w-6 h-6" />
                </div>
                <CardTitle className="text-base font-bold mt-2 text-foreground group-hover:text-amber-600 transition-colors flex items-center justify-between">
                  <span>Lodging Rooms</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-amber-600" />
                </CardTitle>
                <CardDescription className="text-xs">
                  19 gender-separated rooms, Head of Room assignments, and 1-click printable PDF rosters.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 text-xs">
                  19 Rooms (7 Male, 12 Female)
                </Badge>
              </CardContent>
            </Card>
          </Link>
          */}

          {/* Groups Module */}
          <Link href="/camp/groups" className="group">
            <Card className="h-full border shadow-sm bg-card hover:border-purple-500 transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="p-3 bg-purple-500/10 text-purple-600 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <CardTitle className="text-base font-bold mt-2 text-foreground group-hover:text-purple-600 transition-colors flex items-center justify-between">
                  <span>Camp Groups</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-purple-600" />
                </CardTitle>
                <CardDescription className="text-xs">
                  Manage balanced camp groups, assign group leaders, and download group rosters.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200 text-xs">
                  {stats.totalGroups} Balanced Groups
                </Badge>
              </CardContent>
            </Card>
          </Link>

          {/* Print Badges Module */}
          <Link href="/camp/print-tags" className="group">
            <Card className="h-full border shadow-sm bg-card hover:border-cyan-500 transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="p-3 bg-cyan-500/10 text-cyan-600 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                  <Printer className="w-6 h-6" />
                </div>
                <CardTitle className="text-base font-bold mt-2 text-foreground group-hover:text-cyan-600 transition-colors flex items-center justify-between">
                  <span>Badge Printing</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-cyan-600" />
                </CardTitle>
                <CardDescription className="text-xs">
                  Batch print all 54×85.6mm standard front badges with photo and leadership details.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-200 text-xs">
                  Batch PDF Export Ready
                </Badge>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Two Column Grid: Sending Branches & Camp Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sending Branches Breakdown */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" />
                <CardTitle className="text-base font-bold">Sending Branches</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">
                {branchBreakdown.length} Sending Locations
              </span>
            </div>
            <CardDescription className="text-xs">
              Distribution of delegates across church branches.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {branchBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground italic">
                No branch data available yet.
              </div>
            ) : (
              branchBreakdown.slice(0, 6).map((b, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{b.branch}</span>
                    <span className="text-muted-foreground font-mono">
                      {b.count} delegates ({b.percentage}%)
                    </span>
                  </div>
                  <Progress value={b.percentage} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Camp Groups Breakdown */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <CardTitle className="text-base font-bold">Camp Groups</CardTitle>
              </div>
              <Link href="/camp/groups" className="text-xs text-primary hover:underline font-semibold">
                Manage Groups &rarr;
              </Link>
            </div>
            <CardDescription className="text-xs">
              Current membership across camp groups.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {groupBreakdown.map((g) => (
                <div
                  key={g.id}
                  className="p-3 bg-muted/40 rounded-xl border flex items-center justify-between hover:bg-muted/60 transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-bold text-xs text-foreground truncate">{g.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {g.leader ? `Leader: ${g.leader}` : "No Leader Assigned"}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs font-bold shrink-0">
                    {g.memberCount}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Delegate Registrations Feed */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <CardTitle className="text-base font-bold">Recent Registered Attendees</CardTitle>
            </div>
            <Link href="/camp/members">
              <Button variant="outline" size="sm" className="text-xs gap-1">
                <span>View All Attendees ({stats.totalAttendees})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
          <CardDescription className="text-xs">
            Latest delegates registered for MOR Camp 2026.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y text-xs">
            {recentAttendees.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground italic">
                No delegates registered yet. Click &quot;Register Attendee&quot; or &quot;Bulk Import&quot; to begin.
              </div>
            ) : (
              recentAttendees.map((att) => (
                <div
                  key={att.id}
                  className="p-3.5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {att.badgeId.replace("MOR-", "")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{att.fullName}</span>
                        <Badge
                          variant="outline"
                          className={
                            att.gender === "Male"
                              ? "bg-blue-500/10 text-blue-600 border-blue-200 text-[10px]"
                              : "bg-pink-500/10 text-pink-600 border-pink-200 text-[10px]"
                          }
                        >
                          {att.gender}
                        </Badge>
                        {att.position === "Leader" && (
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200 text-[10px]">
                            Leader
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="font-mono text-primary font-semibold">{att.badgeId}</span>
                        {att.branch && <span>• {att.branch}</span>}
                        {/* {att.room && <span>• Room: {att.room}</span>} */}
                        {att.caregroup && <span>• Group: {att.caregroup}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 gap-1.5 border-slate-700 bg-slate-900 text-slate-100 hover:bg-primary/20 hover:text-primary hover:border-primary/40 font-semibold"
                      onClick={() => handleDownloadTag(att)}
                    >
                      <Download className="w-3.5 h-3.5 text-teal-400" />
                      Download Tag
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Import Modal */}
      <CampBulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        onSuccess={() => {
          window.location.reload()
        }}
      />
    </div>
  )
}
