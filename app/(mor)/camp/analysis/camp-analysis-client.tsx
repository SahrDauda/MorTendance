"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Users,
  Sparkles,
  RefreshCw,
  Clock,
  CalendarDays,
  FileDown,
  Building2,
  Layers,
  Phone,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  UserX,
  AlertTriangle,
  Check,
  Search,
  ExternalLink,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import {
  CAMP_SCHEDULE,
  CampSessionDef,
  getSessionDef,
  getNextSession,
  getPreviousSession,
} from "@/lib/campSchedule"
import { ROUTES } from "@/lib/constants"

interface CampMemberRecord {
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
  isPresent: boolean
  isLate: boolean
  scannedAt: string | null
  attendanceId: string | null
}

interface AttendanceSummary {
  totalMembers: number
  presentCount: number
  onTimeCount: number
  lateCount: number
  absentCount: number
  presentPercent: number
  branchBreakdown: Record<string, { total: number; present: number; onTime: number; late: number }>
  groupBreakdown: Record<string, { total: number; present: number; onTime: number; late: number }>
}

export function CampAnalysisClient({ userRole }: { userRole: string }) {
  const [currentSession, setCurrentSession] = useState<string>(CAMP_SCHEDULE[0].name)
  const [members, setMembers] = useState<CampMemberRecord[]>([])
  const [summary, setSummary] = useState<AttendanceSummary>({
    totalMembers: 0,
    presentCount: 0,
    onTimeCount: 0,
    lateCount: 0,
    absentCount: 0,
    presentPercent: 0,
    branchBreakdown: {},
    groupBreakdown: {},
  })
  const [loading, setLoading] = useState(true)
  const [selectedGroupTab, setSelectedGroupTab] = useState<string>("ALL")
  const [memberSearch, setMemberSearch] = useState("")

  const currentSessionDef = useMemo(() => {
    return getSessionDef(currentSession)
  }, [currentSession])

  const nextSession = useMemo(() => {
    return getNextSession(currentSession)
  }, [currentSession])

  const prevSession = useMemo(() => {
    return getPreviousSession(currentSession)
  }, [currentSession])

  // Restore saved session from localStorage on initial mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mor_active_session")
      if (saved && (CAMP_SCHEDULE.some((s) => s.name === saved) || saved.length > 0)) {
        setCurrentSession(saved)
      }
    }
  }, [])

  const switchSession = (sessionName: string) => {
    setCurrentSession(sessionName)
    if (typeof window !== "undefined") {
      localStorage.setItem("mor_active_session", sessionName)
    }
    const def = getSessionDef(sessionName)
    toast.success(`Switched analysis to ${def?.shortLabel || sessionName}`)
  }

  const fetchAttendance = async (sessionName = currentSession) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/camp/attendance?session=${encodeURIComponent(sessionName)}`)
      const json = await res.json()
      if (json.success) {
        setMembers(json.data.members)
        setSummary(json.data.summary)
      } else {
        toast.error(json.error || "Failed to load attendance")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load analysis data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance(currentSession)
  }, [currentSession])

  // Group Analysis Data Computation
  const groupAnalysis = useMemo(() => {
    const map: Record<
      string,
      {
        name: string
        total: number
        present: number
        onTime: number
        late: number
        absent: number
        presentRate: number
        onTimeRate: number
        lateRate: number
        absentRate: number
        absentList: CampMemberRecord[]
        lateList: CampMemberRecord[]
        onTimeList: CampMemberRecord[]
        allMembers: CampMemberRecord[]
      }
    > = {}

    // Initialize all standard groups
    const standardGroups = ["Dikaiosis", "Doxasmus", "Hagiasmos", "Huiothesia", "Paligenesia"]
    standardGroups.forEach((g) => {
      map[g] = {
        name: g,
        total: 0,
        present: 0,
        onTime: 0,
        late: 0,
        absent: 0,
        presentRate: 0,
        onTimeRate: 0,
        lateRate: 0,
        absentRate: 0,
        absentList: [],
        lateList: [],
        onTimeList: [],
        allMembers: [],
      }
    })

    members.forEach((m) => {
      const gName = (m.caregroup || "Unassigned").trim()
      if (!map[gName]) {
        map[gName] = {
          name: gName,
          total: 0,
          present: 0,
          onTime: 0,
          late: 0,
          absent: 0,
          presentRate: 0,
          onTimeRate: 0,
          lateRate: 0,
          absentRate: 0,
          absentList: [],
          lateList: [],
          onTimeList: [],
          allMembers: [],
        }
      }

      const item = map[gName]
      item.total++
      item.allMembers.push(m)

      if (m.isPresent) {
        item.present++
        if (m.isLate) {
          item.late++
          item.lateList.push(m)
        } else {
          item.onTime++
          item.onTimeList.push(m)
        }
      } else {
        item.absent++
        item.absentList.push(m)
      }
    })

    // Compute rates
    Object.values(map).forEach((item) => {
      item.presentRate = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0
      item.onTimeRate = item.total > 0 ? Math.round((item.onTime / item.total) * 100) : 0
      item.lateRate = item.total > 0 ? Math.round((item.late / item.total) * 100) : 0
      item.absentRate = item.total > 0 ? Math.round((item.absent / item.total) * 100) : 0
    })

    return map
  }, [members])

  // Schedule by Day for selector
  const scheduleByDay = useMemo(() => {
    const days: Record<string, CampSessionDef[]> = {
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
    }
    CAMP_SCHEDULE.forEach((s) => {
      if (days[s.day]) days[s.day].push(s)
    })
    return days
  }, [])

  // Export Analysis PDF
  const handleExportPDF = () => {
    if (members.length === 0) {
      toast.error("No records to export")
      return
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, 210, 26, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text("MOR CAMP 2026 — GROUP ATTENDANCE ANALYSIS", 14, 11)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(203, 213, 225)
    doc.text(`Official Session Breakdown: ${currentSession}`, 14, 18)

    // Summary Box
    doc.setTextColor(15, 23, 42)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text(
      `Overall: ${summary.totalMembers} Delegates | Present: ${summary.presentCount} (${summary.presentPercent}%) | On-Time: ${summary.onTimeCount} | Late: ${summary.lateCount} | Absent: ${summary.absentCount}`,
      14,
      33
    )

    // Group Table
    const groupRows = Object.values(groupAnalysis).map((g) => [
      g.name,
      String(g.total),
      `${g.present} (${g.presentRate}%)`,
      `${g.onTime} (${g.onTimeRate}%)`,
      `${g.late} (${g.lateRate}%)`,
      `${g.absent} (${g.absentRate}%)`,
    ])

    autoTable(doc, {
      startY: 38,
      head: [["Camp Group", "Total", "Present (%)", "On-Time (%)", "Late (%)", "Absent (%)"]],
      body: groupRows,
      theme: "grid",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
      },
      bodyStyles: { fontSize: 8, cellPadding: 2.5 },
    })

    const safeFilename = currentSession.replace(/[^a-zA-Z0-9_-]/g, "_")
    doc.save(`MOR_Camp_Group_Analysis_${safeFilename}.pdf`)
    toast.success("Downloaded Group Analysis PDF")
  }

  const activeGroupKeys = Object.keys(groupAnalysis)

  return (
    <div className="w-full max-w-full space-y-6 pb-24 sm:pb-16 overflow-x-hidden">
      {/* Header & Session Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-4 sm:p-6 rounded-2xl border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-primary/10 text-primary text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              MOR Camp Intelligence
            </span>
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              Per-Group Absent & Late Radar
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Group Attendance Analysis
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time analytics per fellowship group showing absent, late, and on-time delegates with contact follow-up.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Prev */}
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-10 rounded-xl"
            disabled={!prevSession}
            onClick={() => prevSession && switchSession(prevSession.name)}
            title={prevSession ? `Previous: ${prevSession.shortLabel}` : ""}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Selector */}
          <Select value={currentSession} onValueChange={switchSession}>
            <SelectTrigger className="flex-1 sm:w-[280px] md:w-[300px] h-11 font-bold bg-background border-primary/40 text-xs sm:text-sm rounded-xl">
              <CalendarDays className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[420px]">
              {Object.entries(scheduleByDay).map(([day, sessions]) => (
                <SelectGroup key={day}>
                  <SelectLabel className="text-[11px] font-black text-primary uppercase px-2 py-1.5 bg-muted/40">
                    DAY — {day.toUpperCase()}
                  </SelectLabel>
                  {sessions.map((sess) => (
                    <SelectItem key={sess.name} value={sess.name} className="text-xs font-semibold py-2">
                      {sess.shortLabel}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          {/* Next */}
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-10 rounded-xl"
            disabled={!nextSession}
            onClick={() => nextSession && switchSession(nextSession.name)}
            title={nextSession ? `Next: ${nextSession.shortLabel}` : ""}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Refresh */}
          <Button
            variant="outline"
            className="h-11 px-3.5 rounded-xl"
            onClick={() => fetchAttendance()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>

          {/* Export PDF */}
          <Button
            variant="outline"
            className="h-11 px-3.5 rounded-xl gap-1.5 text-xs font-bold"
            onClick={handleExportPDF}
            title="Download PDF Report"
          >
            <FileDown className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total */}
        <Card className="border bg-card shadow-sm p-4 rounded-2xl">
          <div className="text-[11px] font-bold text-muted-foreground uppercase">Total Delegates</div>
          <div className="text-2xl sm:text-3xl font-black text-foreground mt-1">{summary.totalMembers}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Across all 5 groups</div>
        </Card>

        {/* Present */}
        <Card className="border bg-emerald-500/10 border-emerald-500/30 shadow-sm p-4 rounded-2xl">
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Verified Present</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{summary.presentCount}</div>
          <div className="text-xs font-bold text-emerald-600 mt-0.5">{summary.presentPercent}% Attendance Rate</div>
        </Card>

        {/* On Time */}
        <Card className="border bg-emerald-500/5 border-emerald-500/20 shadow-sm p-4 rounded-2xl">
          <div className="text-[11px] font-bold text-emerald-600 uppercase">On Time</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{summary.onTimeCount}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {summary.totalMembers > 0 ? Math.round((summary.onTimeCount / summary.totalMembers) * 100) : 0}% of Total
          </div>
        </Card>

        {/* Late */}
        <Card className="border bg-amber-500/10 border-amber-500/30 shadow-sm p-4 rounded-2xl">
          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase">Late Arrivals</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{summary.lateCount}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {summary.totalMembers > 0 ? Math.round((summary.lateCount / summary.totalMembers) * 100) : 0}% of Total
          </div>
        </Card>

        {/* Absent */}
        <Card className="border bg-red-500/10 border-red-500/30 shadow-sm p-4 rounded-2xl col-span-2 lg:col-span-1">
          <div className="text-[11px] font-bold text-red-700 dark:text-red-400 uppercase">Absent / Missing</div>
          <div className="text-2xl sm:text-3xl font-black text-red-600 mt-1">{summary.absentCount}</div>
          <div className="text-xs text-red-600 font-bold mt-0.5">
            {summary.totalMembers > 0 ? Math.round((summary.absentCount / summary.totalMembers) * 100) : 0}% Missing
          </div>
        </Card>
      </div>

      {/* Groups Comparison Performance Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Camp Groups Attendance Comparison
          </h2>
          <span className="text-xs text-muted-foreground font-semibold">
            {currentSessionDef?.shortLabel || currentSession}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {Object.values(groupAnalysis).map((group) => (
            <Card
              key={group.name}
              className={`border-2 transition-all shadow-sm rounded-2xl flex flex-col justify-between cursor-pointer hover:shadow-md ${
                selectedGroupTab === group.name
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-primary/40"
              }`}
              onClick={() => setSelectedGroupTab(group.name)}
            >
              <CardHeader className="p-4 pb-2 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <CardTitle className="text-base font-black text-foreground truncate">
                    {group.name}
                  </CardTitle>
                  <Badge className="bg-purple-500/15 text-purple-700 text-[10px] font-bold">
                    {group.total} Total
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                  <span>Attendance:</span>
                  <strong className="text-emerald-600 font-bold">{group.presentRate}%</strong>
                </div>
                <Progress value={group.presentRate} className="h-1.5" />
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-2">
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs pt-1">
                  <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20">
                    <span className="text-[9px] text-emerald-700 font-bold block uppercase">On Time</span>
                    <strong className="text-emerald-600 text-xs">{group.onTime}</strong>
                  </div>
                  <div className="bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                    <span className="text-[9px] text-amber-700 font-bold block uppercase">Late</span>
                    <strong className="text-amber-600 text-xs">{group.late}</strong>
                  </div>
                  <div className="bg-red-500/10 p-1.5 rounded-lg border border-red-500/20">
                    <span className="text-[9px] text-red-700 font-bold block uppercase">Absent</span>
                    <strong className="text-red-600 text-xs">{group.absent}</strong>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={selectedGroupTab === group.name ? "default" : "outline"}
                  className="w-full text-xs font-bold h-8 rounded-xl mt-1"
                >
                  {selectedGroupTab === group.name ? "Viewing Group Roster" : "Inspect Group"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Deep-Dive Per-Group Member Lists (Absent & Late) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border">
          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-600" />
              Detailed Group Roster & Follow-Up
            </h3>
            <p className="text-xs text-muted-foreground">
              Filter by group to see absent delegates to call and late attendees with check-in timestamps.
            </p>
          </div>

          {/* Group Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              variant={selectedGroupTab === "ALL" ? "default" : "outline"}
              className="text-xs font-bold h-8 px-2.5 rounded-xl"
              onClick={() => setSelectedGroupTab("ALL")}
            >
              All Groups ({members.length})
            </Button>
            {activeGroupKeys.map((gKey) => (
              <Button
                key={gKey}
                size="sm"
                variant={selectedGroupTab === gKey ? "default" : "outline"}
                className="text-xs font-bold h-8 px-2.5 rounded-xl"
                onClick={() => setSelectedGroupTab(gKey)}
              >
                {gKey} ({groupAnalysis[gKey].total})
              </Button>
            ))}
          </div>
        </div>

        {/* Group Deep-Dive Display */}
        {activeGroupKeys
          .filter((gKey) => selectedGroupTab === "ALL" || selectedGroupTab === gKey)
          .map((gKey) => {
            const gData = groupAnalysis[gKey]
            return (
              <Card key={gKey} className="border-2 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/30 p-4 sm:p-5 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg sm:text-xl font-black text-foreground">
                          Group: {gData.name}
                        </CardTitle>
                        <Badge className="bg-purple-500/15 text-purple-700 font-bold text-xs">
                          {gData.total} Members
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        Attendance: <strong>{gData.presentRate}%</strong> ({gData.present} Present • {gData.onTime} On-Time • {gData.late} Late • {gData.absent} Absent)
                      </CardDescription>
                    </div>

                    <Link href={ROUTES.CAMP_ATTENDANCE}>
                      <Button size="sm" variant="outline" className="text-xs font-bold h-8 rounded-xl gap-1">
                        <span>Check In Desk</span>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-4">
                  <Tabs defaultValue="absent" className="space-y-4">
                    <TabsList className="bg-muted/50 p-1 rounded-xl">
                      <TabsTrigger value="absent" className="rounded-lg text-xs font-bold gap-1.5 text-red-600 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                        🔴 Absent Members ({gData.absentList.length})
                      </TabsTrigger>
                      <TabsTrigger value="late" className="rounded-lg text-xs font-bold gap-1.5 text-amber-600 data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                        🟡 Late Members ({gData.lateList.length})
                      </TabsTrigger>
                      <TabsTrigger value="ontime" className="rounded-lg text-xs font-bold gap-1.5 text-emerald-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                        🟢 On-Time Members ({gData.onTimeList.length})
                      </TabsTrigger>
                    </TabsList>

                    {/* Absent Tab Content */}
                    <TabsContent value="absent" className="space-y-3">
                      {gData.absentList.length === 0 ? (
                        <div className="p-6 text-center bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-xs font-bold text-emerald-600 flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>100% Attendance! No absent members in {gData.name}.</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {gData.absentList.map((m) => (
                            <div
                              key={m.id}
                              className="p-3 bg-red-500/5 border border-red-500/30 rounded-xl flex flex-col justify-between gap-2.5 hover:border-red-500/60 transition-all"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono font-bold text-xs text-primary">{m.badgeId}</span>
                                  <span className="text-[10px] font-black uppercase text-red-600 bg-red-500/15 px-1.5 py-0.5 rounded">
                                    ABSENT
                                  </span>
                                </div>
                                <div className="font-bold text-sm text-foreground truncate">{m.fullName}</div>
                                <div className="text-[11px] text-muted-foreground">{m.branch || "HQ"} • {m.position || "Member"}</div>
                              </div>

                              <div className="pt-2 border-t border-red-500/20 flex items-center justify-between gap-2">
                                {m.phone ? (
                                  <a
                                    href={`tel:${m.phone}`}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>Call {m.phone}</span>
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground">No phone</span>
                                )}

                                <Link href={ROUTES.CAMP_ATTENDANCE}>
                                  <span className="text-xs font-bold text-emerald-600 hover:underline">Check In ➔</span>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Late Tab Content */}
                    <TabsContent value="late" className="space-y-3">
                      {gData.lateList.length === 0 ? (
                        <div className="p-6 text-center bg-muted/40 rounded-xl border text-xs text-muted-foreground">
                          No late arrivals recorded for this session.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {gData.lateList.map((m) => (
                            <div
                              key={m.id}
                              className="p-3 bg-amber-500/5 border border-amber-500/30 rounded-xl flex flex-col justify-between gap-2"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono font-bold text-xs text-primary">{m.badgeId}</span>
                                  <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> LATE
                                  </span>
                                </div>
                                <div className="font-bold text-sm text-foreground truncate">{m.fullName}</div>
                                <div className="text-[11px] text-muted-foreground">{m.branch || "HQ"}</div>
                              </div>

                              {m.scannedAt && (
                                <div className="text-[11px] text-amber-700 font-semibold pt-1 border-t border-amber-500/20 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Checked in at: {new Date(m.scannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* On-Time Tab Content */}
                    <TabsContent value="ontime" className="space-y-3">
                      {gData.onTimeList.length === 0 ? (
                        <div className="p-6 text-center bg-muted/40 rounded-xl border text-xs text-muted-foreground">
                          No on-time check-ins recorded yet for this session.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {gData.onTimeList.map((m) => (
                            <div
                              key={m.id}
                              className="p-3 bg-emerald-500/5 border border-emerald-500/30 rounded-xl flex flex-col justify-between gap-2"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono font-bold text-xs text-primary">{m.badgeId}</span>
                                  <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Check className="w-3 h-3" /> ON TIME
                                  </span>
                                </div>
                                <div className="font-bold text-sm text-foreground truncate">{m.fullName}</div>
                                <div className="text-[11px] text-muted-foreground">{m.branch || "HQ"}</div>
                              </div>

                              {m.scannedAt && (
                                <div className="text-[11px] text-emerald-700 font-semibold pt-1 border-t border-emerald-500/20 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Checked in at: {new Date(m.scannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )
          })}
      </div>
    </div>
  )
}
