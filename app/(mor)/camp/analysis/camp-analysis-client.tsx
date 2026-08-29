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
  ChevronDown,
  ChevronUp,
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
  isCheckInLate,
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
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Accordion state: which group is expanded and which category ("ABSENT" | "LATE" | "ON_TIME")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Dikaiosis: true, // Default first group open for immediate visibility
  })
  const [groupActiveCategory, setGroupActiveCategory] = useState<Record<string, "ABSENT" | "LATE" | "ON_TIME">>({
    Dikaiosis: "ABSENT",
    Doxasmus: "ABSENT",
    Hagiasmos: "ABSENT",
    Huiothesia: "ABSENT",
    Paligenesia: "ABSENT",
  })

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

  // Direct 1-Tap Check-In from Analysis Page
  const handleCheckInMember = async (member: CampMemberRecord) => {
    setUpdatingId(member.id)
    const willBeLate = isCheckInLate(currentSession, new Date())

    // Optimistic UI update
    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? {
              ...m,
              isPresent: true,
              isLate: willBeLate,
              scannedAt: new Date().toISOString(),
            }
          : m
      )
    )

    try {
      const res = await fetch("/api/camp/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          session: currentSession,
          isPresent: true,
        }),
      })
      const json = await res.json()
      if (json.success) {
        if (willBeLate) {
          toast.warning(`⚠️ ${member.fullName} checked in [LATE]`)
        } else {
          toast.success(`✅ ${member.fullName} checked in [ON TIME]`)
        }
      } else {
        toast.error(json.error || "Check-in failed")
        fetchAttendance()
      }
    } catch (err) {
      toast.error("Error updating check-in")
      fetchAttendance()
    } finally {
      setUpdatingId(null)
    }
  }

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

  // Toggle group accordion and select category
  const toggleGroupAccordion = (groupName: string, category?: "ABSENT" | "LATE" | "ON_TIME") => {
    setExpandedGroups((prev) => {
      const isOpen = Boolean(prev[groupName])
      // If clicking the same category and already open, toggle closed; otherwise open with that category
      if (category) {
        setGroupActiveCategory((catPrev) => ({ ...catPrev, [groupName]: category }))
        return { ...prev, [groupName]: true }
      }
      return { ...prev, [groupName]: !isOpen }
    })
  }

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

  return (
    <div className="w-full max-w-full space-y-6 pb-28 sm:pb-16 overflow-x-hidden">
      {/* Header & Session Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-4 sm:p-6 rounded-2xl border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-primary/10 text-primary text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              MOR Camp Intelligence
            </span>
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              Per-Group Absent & Late Accordion
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Group Attendance Analysis
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Tap <strong>Absent</strong>, <strong>Late</strong>, or <strong>On Time</strong> on any group card to expand the member list with contact follow-up.
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

      {/* ======================================================== */}
      {/* ACCORDION GROUP CARDS WITH DIRECT ABSENT / LATE EXPANSION */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Fellowship Groups Analysis & Accordion
            </h2>
            <p className="text-xs text-muted-foreground">
              Select <strong>Absent ({summary.absentCount})</strong>, <strong>Late ({summary.lateCount})</strong>, or <strong>On Time</strong> to inspect names directly.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {Object.values(groupAnalysis).map((group) => {
            const isExpanded = Boolean(expandedGroups[group.name])
            const activeCat = groupActiveCategory[group.name] || "ABSENT"

            const activeList =
              activeCat === "ABSENT"
                ? group.absentList
                : activeCat === "LATE"
                ? group.lateList
                : group.onTimeList

            return (
              <Card
                key={group.name}
                className={`border-2 transition-all shadow-md rounded-2xl overflow-hidden ${
                  isExpanded
                    ? "border-primary/80 ring-2 ring-primary/20 bg-card"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {/* Group Card Header */}
                <CardHeader className="p-4 sm:p-5 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl sm:text-2xl font-black text-foreground">
                          {group.name}
                        </CardTitle>
                        <Badge className="bg-purple-500/15 text-purple-700 font-bold text-xs">
                          {group.total} Total Members
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Attendance:</span>
                        <strong className="text-emerald-600 font-bold text-sm">
                          {group.presentRate}%
                        </strong>
                        <span>({group.present} Present / {group.absent} Absent)</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full sm:w-48 space-y-1">
                      <Progress value={group.presentRate} className="h-2" />
                    </div>
                  </div>

                  {/* 3 Interactive Accordion Selector Pills */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3">
                    {/* On Time Pill */}
                    <button
                      type="button"
                      onClick={() => toggleGroupAccordion(group.name, "ON_TIME")}
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                        isExpanded && activeCat === "ON_TIME"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30 scale-[1.02]"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20"
                      }`}
                    >
                      <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                        isExpanded && activeCat === "ON_TIME" ? "text-emerald-100" : "text-emerald-700 dark:text-emerald-400"
                      }`}>
                        On Time
                      </span>
                      <strong className="text-base sm:text-xl font-black mt-0.5">
                        {group.onTime}
                      </strong>
                    </button>

                    {/* Late Pill */}
                    <button
                      type="button"
                      onClick={() => toggleGroupAccordion(group.name, "LATE")}
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                        isExpanded && activeCat === "LATE"
                          ? "bg-amber-500 text-black border-amber-500 shadow-md ring-2 ring-amber-500/30 scale-[1.02]"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20"
                      }`}
                    >
                      <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                        isExpanded && activeCat === "LATE" ? "text-slate-900" : "text-amber-700 dark:text-amber-400"
                      }`}>
                        Late
                      </span>
                      <strong className="text-base sm:text-xl font-black mt-0.5">
                        {group.late}
                      </strong>
                    </button>

                    {/* Absent Pill */}
                    <button
                      type="button"
                      onClick={() => toggleGroupAccordion(group.name, "ABSENT")}
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                        isExpanded && activeCat === "ABSENT"
                          ? "bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-500/30 scale-[1.02]"
                          : "bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300 hover:bg-red-500/20"
                      }`}
                    >
                      <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                        isExpanded && activeCat === "ABSENT" ? "text-red-100" : "text-red-700 dark:text-red-400"
                      }`}>
                        Absent
                      </span>
                      <strong className="text-base sm:text-xl font-black mt-0.5">
                        {group.absent}
                      </strong>
                    </button>
                  </div>
                </CardHeader>

                {/* Toggle Accordion Expand / Collapse Button */}
                <div className="px-4 sm:px-5 pb-3">
                  <Button
                    variant={isExpanded ? "secondary" : "outline"}
                    className="w-full text-xs font-bold h-9 rounded-xl flex items-center justify-center gap-2"
                    onClick={() => toggleGroupAccordion(group.name)}
                  >
                    <span>
                      {isExpanded
                        ? `Hide ${activeCat === "ABSENT" ? "Absent" : activeCat === "LATE" ? "Late" : "On-Time"} List (${activeList.length})`
                        : `View ${activeCat === "ABSENT" ? "Absent" : activeCat === "LATE" ? "Late" : "On-Time"} Members (${activeList.length})`}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>

                {/* =================================================== */}
                {/* ACCORDION CONTENT DRAWER: EXPANDED MEMBER LIST */}
                {/* =================================================== */}
                {isExpanded && (
                  <CardContent className="p-4 sm:p-5 pt-0 space-y-3 border-t bg-muted/20">
                    <div className="flex items-center justify-between pt-3">
                      <div className="flex items-center gap-2">
                        {activeCat === "ABSENT" && (
                          <Badge className="bg-red-600 text-white font-black text-xs px-2.5 py-0.5">
                            🔴 ABSENT MEMBERS IN {group.name.toUpperCase()} ({activeList.length})
                          </Badge>
                        )}
                        {activeCat === "LATE" && (
                          <Badge className="bg-amber-500 text-black font-black text-xs px-2.5 py-0.5">
                            🟡 LATE ARRIVALS IN {group.name.toUpperCase()} ({activeList.length})
                          </Badge>
                        )}
                        {activeCat === "ON_TIME" && (
                          <Badge className="bg-emerald-600 text-white font-black text-xs px-2.5 py-0.5">
                            🟢 ON-TIME ATTENDEES IN {group.name.toUpperCase()} ({activeList.length})
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleGroupAccordion(group.name, "ABSENT")}
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                            activeCat === "ABSENT" ? "bg-red-600 text-white border-red-600" : "bg-background text-red-600 border-red-500/30"
                          }`}
                        >
                          Absent ({group.absent})
                        </button>
                        <button
                          onClick={() => toggleGroupAccordion(group.name, "LATE")}
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                            activeCat === "LATE" ? "bg-amber-500 text-black border-amber-500" : "bg-background text-amber-600 border-amber-500/30"
                          }`}
                        >
                          Late ({group.late})
                        </button>
                        <button
                          onClick={() => toggleGroupAccordion(group.name, "ON_TIME")}
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                            activeCat === "ON_TIME" ? "bg-emerald-600 text-white border-emerald-600" : "bg-background text-emerald-600 border-emerald-500/30"
                          }`}
                        >
                          On Time ({group.onTime})
                        </button>
                      </div>
                    </div>

                    {/* Member Cards Grid */}
                    {activeList.length === 0 ? (
                      <div className="p-8 text-center bg-background rounded-2xl border border-dashed text-xs font-semibold text-muted-foreground">
                        {activeCat === "ABSENT" ? (
                          <div className="space-y-1">
                            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                            <div className="font-bold text-foreground">100% Attendance in {group.name}!</div>
                            <div>No delegates are currently absent for this session.</div>
                          </div>
                        ) : activeCat === "LATE" ? (
                          <div>No late check-ins recorded for {group.name}.</div>
                        ) : (
                          <div>No on-time check-ins recorded yet for {group.name}.</div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {activeList.map((member) => (
                          <div
                            key={member.id}
                            className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition-all shadow-sm ${
                              activeCat === "ABSENT"
                                ? "bg-red-500/5 border-red-500/30 hover:border-red-500/60"
                                : activeCat === "LATE"
                                ? "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/60"
                                : "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/60"
                            }`}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono font-black text-xs text-primary">
                                  {member.badgeId}
                                </span>
                                {activeCat === "ABSENT" ? (
                                  <span className="text-[10px] font-black uppercase text-red-600 bg-red-500/15 px-1.5 py-0.5 rounded">
                                    ABSENT
                                  </span>
                                ) : activeCat === "LATE" ? (
                                  <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> LATE
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Check className="w-3 h-3" /> ON TIME
                                  </span>
                                )}
                              </div>

                              <div className="font-black text-sm text-foreground truncate">
                                {member.fullName}
                              </div>

                              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                <span>{member.branch || "HQ"}</span>
                                <span>•</span>
                                <span>{member.position || "Member"}</span>
                              </div>

                              {member.scannedAt && (
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1 pt-0.5">
                                  <Clock className="w-3 h-3 text-muted-foreground" />
                                  <span>
                                    Scanned at:{" "}
                                    {new Date(member.scannedAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Action Footer */}
                            <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                              {member.phone ? (
                                <a
                                  href={`tel:${member.phone}`}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>Call {member.phone}</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">No phone</span>
                              )}

                              {!member.isPresent ? (
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-8 px-2.5 rounded-lg shadow-sm gap-1"
                                  onClick={() => handleCheckInMember(member)}
                                  disabled={updatingId === member.id}
                                >
                                  {updatingId === member.id ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Check IN</span>
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CampAnalysisClient
