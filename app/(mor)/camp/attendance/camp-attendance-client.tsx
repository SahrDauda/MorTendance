"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  CheckCircle2,
  XCircle,
  Users,
  Search,
  RefreshCw,
  Clock,
  CalendarDays,
  FileDown,
  Filter,
  Phone,
  Building2,
  Layers,
  Check,
  CreditCard,
  BookOpen,
  Sunrise,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  UserX,
  AlertCircle,
  Bus,
} from "lucide-react"
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

interface CampRosterMember {
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

export function CampAttendanceClient() {
  const [currentSession, setCurrentSession] = useState<string>(CAMP_SCHEDULE[0].name)
  const [members, setMembers] = useState<CampRosterMember[]>([])
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

  // Name Search & Filters
  const [nameQuery, setNameQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ABSENT" | "ON_TIME" | "LATE">("ABSENT")
  const [filterBranch, setFilterBranch] = useState("ALL")
  const [filterGroup, setFilterGroup] = useState("ALL")



  const nameInputRef = useRef<HTMLInputElement>(null)

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

  // Switch session helper
  const switchSession = (sessionName: string) => {
    setCurrentSession(sessionName)
    setNameQuery("")
    if (typeof window !== "undefined") {
      localStorage.setItem("mor_active_session", sessionName)
    }
    const def = getSessionDef(sessionName)
    toast.success(`Switched to ${def?.shortLabel || sessionName}`)
  }

  // Load records
  const fetchAttendance = async (sessionName = currentSession) => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/camp/attendance?session=${encodeURIComponent(sessionName)}`
      )
      const json = await res.json()
      if (json.success) {
        setMembers(json.data.members)
        setSummary(json.data.summary)
      } else {
        toast.error(json.error || "Failed to load attendance")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load attendance")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance(currentSession)
  }, [currentSession])

  // Single Member 1-Tap Check-In (Automatic On-Time / Late Computation)
  const handleToggleCheckIn = async (member: CampRosterMember) => {
    setUpdatingId(member.id)

    // Toggle: if already present, mark absent; if absent, check-in with automatic lateness
    const willBePresent = !member.isPresent
    const willBeLate = willBePresent ? isCheckInLate(currentSession, new Date()) : false

    // Optimistic UI update
    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? {
              ...m,
              isPresent: willBePresent,
              isLate: willBeLate,
              scannedAt: willBePresent ? new Date().toISOString() : null,
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
          isPresent: willBePresent,
        }),
      })
      const json = await res.json()

      if (json.success) {
        if (willBePresent) {
          const isLateResult = json.data?.isLate || willBeLate
          if (isLateResult) {
            toast.warning(`⚠️ ${member.fullName} checked in [LATE]`)
          } else {
            toast.success(`✅ ${member.fullName} checked in [ON TIME]`)
          }
        } else {
          toast.info(`↩️ Unchecked ${member.fullName} (Marked Absent)`)
        }
      } else {
        toast.error(json.error || "Check-in failed")
        fetchAttendance()
      }
    } catch (err) {
      toast.error("Error updating attendance")
      fetchAttendance()
    } finally {
      setUpdatingId(null)
    }
  }

  // Search Results for Name Lookup
  const searchResults = useMemo(() => {
    if (!nameQuery.trim()) return []
    const q = nameQuery.toLowerCase().trim()

    return members.filter((m) => {
      const matchName = m.fullName.toLowerCase().includes(q)
      const matchBadge = m.badgeId.toLowerCase().includes(q)
      const matchPhone = (m.phone || "").toLowerCase().includes(q)
      return matchName || matchBadge || matchPhone
    })
  }, [members, nameQuery])

  // Filtered members for Roster
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (filterStatus === "ABSENT" && m.isPresent) return false
      if (filterStatus === "ON_TIME" && (!m.isPresent || m.isLate)) return false
      if (filterStatus === "LATE" && (!m.isPresent || !m.isLate)) return false

      if (filterBranch !== "ALL" && (m.branch || "Unassigned") !== filterBranch) return false
      if (filterGroup !== "ALL" && (m.caregroup || "Unassigned") !== filterGroup) return false

      if (nameQuery.trim()) {
        const q = nameQuery.toLowerCase().trim()
        const matchName = m.fullName.toLowerCase().includes(q)
        const matchBadge = m.badgeId.toLowerCase().includes(q)
        const matchPhone = (m.phone || "").toLowerCase().includes(q)
        if (!matchName && !matchBadge && !matchPhone) return false
      }
      return true
    })
  }, [members, filterStatus, filterBranch, filterGroup, nameQuery])

  // List of all Absent Delegates for Special Alert Section
  const absentDelegates = useMemo(() => {
    return members.filter((m) => !m.isPresent)
  }, [members])

  // Unique branches & groups from members
  const uniqueBranches = useMemo(() => {
    const set = new Set<string>()
    members.forEach((m) => {
      if (m.branch) set.add(m.branch.trim())
    })
    return Array.from(set).sort()
  }, [members])

  const uniqueGroups = useMemo(() => {
    const set = new Set<string>()
    members.forEach((m) => {
      if (m.caregroup) set.add(m.caregroup.trim())
    })
    return Array.from(set).sort()
  }, [members])

  // Group by Day for schedule dropdown
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

  // Export PDF Attendance Sheet
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
    doc.text("MINISTRY OF RECONCILIATION — MOR CAMP 2026", 14, 11)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(203, 213, 225)
    doc.text(`Official Attendance Sheet — ${currentSession}`, 14, 18)

    doc.setTextColor(15, 23, 42)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.text(
      `Total: ${summary.totalMembers}  |  On-Time: ${summary.onTimeCount}  |  Late: ${summary.lateCount}  |  Absent: ${summary.absentCount}  |  Rate: ${summary.presentPercent}%`,
      14,
      33
    )

    const tableRows = members.map((m, idx) => [
      String(idx + 1),
      m.badgeId,
      m.fullName,
      m.branch || "—",
      m.caregroup || "—",
      !m.isPresent ? "ABSENT" : m.isLate ? "LATE" : "ON TIME",
      m.scannedAt
        ? new Date(m.scannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "—",
    ])

    autoTable(doc, {
      startY: 37,
      head: [["#", "Badge ID", "Attendee Name", "Branch", "Group", "Status", "Time"]],
      body: tableRows,
      theme: "striped",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 20, fontStyle: "bold" },
        2: { cellWidth: 55, fontStyle: "bold" },
        3: { cellWidth: 28 },
        4: { cellWidth: 32 },
        5: { cellWidth: 22, fontStyle: "bold" },
        6: { cellWidth: 22 },
      },
      didParseCell: function (data) {
        if (data.section === "body" && data.column.index === 5) {
          if (data.cell.raw === "ON TIME") {
            data.cell.styles.textColor = [16, 185, 129]
          } else if (data.cell.raw === "LATE") {
            data.cell.styles.textColor = [217, 119, 6]
          } else {
            data.cell.styles.textColor = [239, 68, 68]
          }
        }
      },
    })

    const safeFilename = currentSession.replace(/[^a-zA-Z0-9_-]/g, "_")
    doc.save(`MOR_Camp_Attendance_${safeFilename}.pdf`)
    toast.success("Downloaded Attendance Sheet PDF")
  }

  // Export CSV
  const handleExportCSV = () => {
    if (members.length === 0) return
    const headers = [
      "Badge ID",
      "Full Name",
      "Phone",
      "Gender",
      "Branch",
      "Caregroup",
      "Room",
      "Position",
      "Status",
      "Scanned At",
    ]
    const rows = members.map((m) => [
      m.badgeId,
      `"${m.fullName}"`,
      m.phone || "",
      m.gender,
      m.branch || "",
      m.caregroup || "",
      m.room || "",
      m.position || "",
      !m.isPresent ? "ABSENT" : m.isLate ? "LATE" : "ON_TIME",
      m.scannedAt ? new Date(m.scannedAt).toLocaleString() : "",
    ])

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    const safeFilename = currentSession.replace(/[^a-zA-Z0-9_-]/g, "_")
    link.setAttribute("download", `MOR_Camp_Attendance_${safeFilename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Downloaded Attendance CSV")
  }

  const isBusSession = currentSession.toLowerCase().includes("bus")

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6 pb-24 sm:pb-12 overflow-x-hidden">
      {/* Top Header Card with Schedule Selector and Quick Nav */}
      <div className="w-full max-w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-4 sm:p-6 rounded-2xl border shadow-sm">
        <div className="space-y-1 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-primary/10 text-primary text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              MOR Camp 2026
            </span>
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Pre-Registered Roster
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-foreground">
            Camp Attendance & Check-In Desk
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Search member names to check in. System automatically records on-time or late based on standard Sierra Leone time.
          </p>
        </div>

        {/* Schedule Selector & Sequence Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto">
          {/* Previous Session Button */}
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-10 rounded-xl border-border hover:bg-muted/60 flex-shrink-0"
            disabled={!prevSession}
            onClick={() => prevSession && switchSession(prevSession.name)}
            title={prevSession ? `Previous: ${prevSession.shortLabel}` : "No previous session"}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Session Dropdown */}
          <Select
            value={currentSession}
            onValueChange={(val) => {
              if (val === "__CUSTOM__") {
                setCustomSessionOpen(true)
              } else {
                switchSession(val)
              }
            }}
          >
            <SelectTrigger className="flex-1 sm:w-[280px] md:w-[320px] h-11 font-bold bg-background border-primary/40 text-xs sm:text-sm shadow-sm rounded-xl">
              <CalendarDays className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[420px]">
              {Object.entries(scheduleByDay).map(([day, sessions]) => (
                <SelectGroup key={day}>
                  <SelectLabel className="text-[11px] font-black text-primary uppercase tracking-wider px-2 py-1.5 bg-muted/40">
                    DAY — {day.toUpperCase()}
                  </SelectLabel>
                  {sessions.map((sess) => (
                    <SelectItem key={sess.name} value={sess.name} className="text-xs font-semibold py-2">
                      <div className="flex items-center justify-between w-full gap-2">
                        <span>{sess.shortLabel}</span>
                        {sess.isTeachingSession && (
                          <span className="text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded font-bold">
                            Teaching
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          {/* Next Session Button */}
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-10 rounded-xl border-border hover:bg-muted/60 flex-shrink-0"
            disabled={!nextSession}
            onClick={() => nextSession && switchSession(nextSession.name)}
            title={nextSession ? `Next: ${nextSession.shortLabel}` : "Last session reached"}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            className="h-11 px-3.5 rounded-xl border-border hover:bg-muted/50 flex-shrink-0"
            onClick={() => fetchAttendance()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Teaching Session Timeline & Lateness Rule Banner */}
      {currentSessionDef && (
        <div className={`w-full max-w-full p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm overflow-hidden ${
          currentSessionDef.isTeachingSession
            ? "bg-amber-500/10 border-amber-500/30"
            : "bg-card border-border"
        }`}>
          <div className="flex items-start gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl mt-0.5 flex-shrink-0 ${
              currentSessionDef.isTeachingSession
                ? "bg-amber-500/20 text-amber-600"
                : "bg-primary/10 text-primary"
            }`}>
              {currentSessionDef.isTeachingSession ? (
                <BookOpen className="w-5 h-5" />
              ) : currentSessionDef.category === "Devotion" ? (
                <Sunrise className="w-5 h-5" />
              ) : isBusSession ? (
                <Bus className="w-5 h-5" />
              ) : (
                <CalendarDays className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-foreground">
                  {currentSessionDef.name}
                </h2>
                {currentSessionDef.isTeachingSession && (
                  <Badge className="bg-amber-500 text-black font-black text-[10px] uppercase">
                    ⭐ Core Teaching Session
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentSessionDef.description}
              </p>
            </div>
          </div>

          {/* Timetable Indicators */}
          <div className="flex items-center gap-2 sm:gap-3 bg-background/80 p-2.5 rounded-xl border border-border/60 text-xs w-full sm:w-auto justify-around sm:justify-end flex-shrink-0">
            {currentSessionDef.reviewStartTime && (
              <div className="text-center px-1.5 sm:px-2">
                <span className="text-[9px] sm:text-[10px] text-emerald-600 font-bold block uppercase">
                  Marking Starts
                </span>
                <strong className="text-foreground font-black text-xs sm:text-sm">
                  {currentSessionDef.reviewStartTime}
                </strong>
              </div>
            )}
            <div className="text-center px-1.5 sm:px-2 border-l border-border">
              <span className="text-[9px] sm:text-[10px] text-amber-600 font-bold block uppercase">
                {currentSessionDef.isTeachingSession ? "Late After" : "Start Time"}
              </span>
              <strong className="text-amber-600 font-black text-xs sm:text-sm">
                {currentSessionDef.teachingStartTime}
              </strong>
            </div>
            <div className="text-center px-1.5 sm:px-2 border-l border-border">
              <span className="text-[9px] sm:text-[10px] text-muted-foreground font-bold block uppercase">
                Ends
              </span>
              <strong className="text-foreground font-black text-xs sm:text-sm">
                {currentSessionDef.endTime}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Live Session Counter Gauge Card */}
      <div className="w-full max-w-full bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl ring-1 ring-emerald-500/40 flex-shrink-0">
                {isBusSession ? <Bus className="w-5 h-5 sm:w-6 sm:h-6" /> : <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />}
              </div>
              <div>
                <div className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest">
                  Live Attendance Check
                </div>
                <div className="text-base sm:text-xl font-black text-slate-100">
                  {currentSessionDef?.shortLabel || currentSession}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* On Time Pill */}
              <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>On Time: {summary.onTimeCount}</span>
              </div>
              {/* Late Pill */}
              <div className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <span>Late: {summary.lateCount}</span>
              </div>
              {/* Absent Pill */}
              <div className="bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <span>Absent: {summary.absentCount}</span>
              </div>
              {/* Total Checked In Badge */}
              <div className="flex items-baseline gap-1.5 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700">
                <span className="text-xl sm:text-2xl font-black text-emerald-400">
                  {summary.presentCount}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  / {summary.totalMembers} ({summary.presentPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-3 sm:h-3.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-primary rounded-full transition-all duration-500"
                style={{ width: `${summary.presentPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] sm:text-[11px] text-slate-400 font-semibold px-1">
              <span className="text-red-400 font-bold">{summary.absentCount} Absent / Remaining</span>
              <span className="text-emerald-400 font-bold">{summary.presentCount} Verified Present</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Name Search & Instant 1-Tap Check-In */}
      <div className="w-full max-w-full bg-card p-4 sm:p-6 rounded-2xl border-2 border-primary/30 shadow-lg space-y-4">
        <div>
          <label className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
            <Search className="w-5 h-5 text-primary flex-shrink-0" />
            Enter Member Name for Check-In
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Call or type delegate name. Tap <strong>Check IN</strong> — system records On-Time or Late automatically based on time.
          </p>
        </div>

        <div className="relative w-full">
          <Input
            ref={nameInputRef}
            placeholder="Type member name (e.g. Israel Kai Kai, Sattu, Konima)..."
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            className="h-13 sm:h-14 pl-4 pr-20 sm:pr-24 text-base sm:text-xl font-bold bg-background border-2 border-primary/50 rounded-2xl shadow-inner text-foreground placeholder:text-muted-foreground/60 w-full"
            autoFocus
          />
          {nameQuery && (
            <button
              onClick={() => {
                setNameQuery("")
                nameInputRef.current?.focus()
              }}
              className="absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold bg-muted hover:bg-muted/80 text-foreground px-2.5 py-1.5 rounded-xl border"
            >
              Clear
            </button>
          )}
        </div>

        {/* Live Search Verification Feedback Cards */}
        {nameQuery.trim().length > 0 && (
          <div className="pt-2 w-full max-w-full">
            {searchResults.length === 0 ? (
              /* NOT REGISTERED WARNING */
              <div className="w-full bg-red-500/10 border-2 border-red-500/40 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-500/20 text-red-600 rounded-xl flex-shrink-0 mt-0.5">
                    <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm sm:text-base font-black text-red-600">
                      NOT REGISTERED IN THE SYSTEM
                    </div>
                    <div className="text-xs sm:text-sm text-foreground break-words">
                      No registration record was found for{" "}
                      <strong className="text-red-600 font-bold">&quot;{nameQuery}&quot;</strong>.
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Only pre-registered delegates are in the roster. Please check spelling.
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-red-500/20">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs font-bold border-red-500/40 hover:bg-red-500/10 w-full sm:w-auto"
                    onClick={() => {
                      setNameQuery("")
                      nameInputRef.current?.focus()
                    }}
                  >
                    Clear & Try Another Name
                  </Button>
                </div>
              </div>
            ) : (
              /* REGISTERED MEMBER(S) FOUND */
              <div className="space-y-3 w-full max-w-full">
                <div className="text-xs font-bold text-emerald-600 px-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{searchResults.length} Registered Member{searchResults.length > 1 ? "s" : ""} Found</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                  {searchResults.map((member) => (
                    <Card
                      key={member.id}
                      className={`w-full border-2 transition-all shadow-md rounded-2xl overflow-hidden ${
                        member.isPresent
                          ? member.isLate
                            ? "bg-amber-500/10 border-amber-500/60"
                            : "bg-emerald-500/10 border-emerald-500/60"
                          : "bg-card border-border hover:border-primary/60"
                      }`}
                    >
                      <CardContent className="p-4 sm:p-5 space-y-3.5">
                        {/* Member Details */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-emerald-600 text-white font-mono text-xs font-bold">
                                {member.badgeId}
                              </Badge>
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                                ✅ REGISTERED
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-foreground pt-1 truncate">
                              {member.fullName}
                            </h3>
                          </div>

                          {member.isPresent ? (
                            member.isLate ? (
                              <Badge className="bg-amber-500 text-black font-bold text-xs px-2.5 py-1 flex items-center gap-1 shadow-sm flex-shrink-0">
                                <Clock className="w-3.5 h-3.5" /> LATE
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-500 text-white font-bold text-xs px-2.5 py-1 flex items-center gap-1 shadow-sm flex-shrink-0">
                                <Check className="w-3.5 h-3.5" /> ON TIME
                              </Badge>
                            )
                          ) : (
                            <Badge variant="outline" className="border-red-500/40 text-red-600 font-bold text-xs px-2.5 py-1 bg-red-500/10 flex-shrink-0">
                              ABSENT
                            </Badge>
                          )}
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs bg-background/80 p-2.5 sm:p-3 rounded-xl border border-border/60">
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Branch</span>
                            <strong className="text-foreground font-bold truncate block">{member.branch || "HQ"}</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Group</span>
                            <strong className="text-purple-600 font-bold truncate block">{member.caregroup || "Unassigned"}</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Role</span>
                            <span className="text-foreground font-semibold truncate block">{member.position || "Member"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Payment</span>
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <CreditCard className="w-3 h-3 flex-shrink-0" /> Paid
                            </span>
                          </div>
                        </div>

                        {/* 1-Tap Check-In Action */}
                        <div className="pt-1">
                          {member.isPresent ? (
                            <Button
                              variant="outline"
                              className="w-full bg-emerald-500/15 border-emerald-500/50 text-emerald-700 hover:bg-emerald-500/25 font-black text-xs sm:text-sm h-11 rounded-xl"
                              onClick={() => handleToggleCheckIn(member)}
                              disabled={updatingId === member.id}
                            >
                              {updatingId === member.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
                                  Checked In ({member.isLate ? "LATE" : "ON TIME"}) — Tap to Undo
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm h-12 rounded-xl shadow-lg gap-2"
                              onClick={() => handleToggleCheckIn(member)}
                              disabled={updatingId === member.id}
                            >
                              {updatingId === member.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                              ) : (
                                <>
                                  <Check className="w-5 h-5 flex-shrink-0" />
                                  {isBusSession ? "Board Bus Now" : "Check IN"}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SPECIAL PLACE FOR ABSENT DELEGATES (Follow-up & Calling Center) */}
      <div className="w-full bg-gradient-to-r from-red-500/10 via-card to-card border-2 border-red-500/30 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-500/20 text-red-600 rounded-xl flex-shrink-0">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                Flagged Absent Members ({summary.absentCount})
              </h3>
              <p className="text-xs text-muted-foreground">
                Members missing from <strong>{currentSessionDef?.shortLabel || currentSession}</strong>. Call or follow up directly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={filterStatus === "ABSENT" ? "default" : "outline"}
              className={`rounded-xl text-xs font-bold h-8 px-3 ${
                filterStatus === "ABSENT"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "border-red-500/40 text-red-600 hover:bg-red-500/10"
              }`}
              onClick={() => setFilterStatus("ABSENT")}
            >
              Filter Roster by Absent Only ({summary.absentCount})
            </Button>
          </div>
        </div>
      </div>

      {/* Full Delegate Attendance Roster & Filter Toolbar */}
      <div className="w-full max-w-full space-y-4">
        <div className="w-full bg-card p-3 sm:p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1">
            {/* 1. ABSENT BUTTON IN FRONT */}
            <Button
              size="sm"
              variant={filterStatus === "ABSENT" ? "default" : "outline"}
              className={`rounded-xl text-xs font-bold h-8 sm:h-9 px-2.5 sm:px-3 ${
                filterStatus === "ABSENT"
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                  : "border-red-500/40 text-red-600 hover:bg-red-500/10"
              }`}
              onClick={() => setFilterStatus("ABSENT")}
            >
              🔴 Absent ({summary.absentCount})
            </Button>

            {/* 2. ON TIME BUTTON */}
            <Button
              size="sm"
              variant={filterStatus === "ON_TIME" ? "default" : "outline"}
              className={`rounded-xl text-xs font-bold h-8 sm:h-9 px-2.5 sm:px-3 ${
                filterStatus === "ON_TIME"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  : "border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
              }`}
              onClick={() => setFilterStatus("ON_TIME")}
            >
              🟢 On Time ({summary.onTimeCount})
            </Button>

            {/* 3. LATE BUTTON */}
            <Button
              size="sm"
              variant={filterStatus === "LATE" ? "default" : "outline"}
              className={`rounded-xl text-xs font-bold h-8 sm:h-9 px-2.5 sm:px-3 ${
                filterStatus === "LATE"
                  ? "bg-amber-500 hover:bg-amber-600 text-black shadow-sm"
                  : "border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
              }`}
              onClick={() => setFilterStatus("LATE")}
            >
              🟡 Late ({summary.lateCount})
            </Button>

            {/* 4. ALL BUTTON */}
            <Button
              size="sm"
              variant={filterStatus === "ALL" ? "default" : "outline"}
              className="rounded-xl text-xs font-bold h-8 sm:h-9 px-2.5 sm:px-3"
              onClick={() => setFilterStatus("ALL")}
            >
              All ({members.length})
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Branch Filter */}
            <Select value={filterBranch} onValueChange={setFilterBranch}>
              <SelectTrigger className="h-8 sm:h-9 text-xs rounded-xl font-semibold w-[120px]">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground mr-1" />
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Branches</SelectItem>
                {uniqueBranches.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Group Filter */}
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="h-8 sm:h-9 text-xs rounded-xl font-semibold w-[120px]">
                <Layers className="w-3.5 h-3.5 text-muted-foreground mr-1" />
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Groups</SelectItem>
                {uniqueGroups.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Export Dropdown */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 px-2.5 rounded-xl text-xs font-bold"
              onClick={handleExportPDF}
              title="Download PDF Roster"
            >
              <FileDown className="w-3.5 h-3.5 text-primary" />
            </Button>
          </div>
        </div>

        {/* Attendee Roster Cards (Same unified design as Tuesday bus) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full">
          {filteredMembers.map((member) => (
            <Card
              key={member.id}
              className={`w-full border transition-all duration-200 shadow-sm overflow-hidden flex flex-col justify-between ${
                member.isPresent
                  ? member.isLate
                    ? "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/60"
                    : "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/60"
                  : "bg-card hover:border-primary/40"
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-black text-sm sm:text-base text-foreground truncate">
                      {member.fullName}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span className="font-mono font-bold text-primary">
                        {member.badgeId}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-foreground">
                        {member.branch || "HQ"}
                      </span>
                      {member.caregroup && (
                        <>
                          <span>•</span>
                          <span className="text-purple-600 font-semibold truncate">
                            {member.caregroup}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {member.isPresent ? (
                    member.isLate ? (
                      <Badge className="bg-amber-500 text-black font-bold text-[10px] sm:text-[11px] px-2 py-0.5 flex-shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Late
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500 text-white font-bold text-[10px] sm:text-[11px] px-2 py-0.5 flex-shrink-0 flex items-center gap-1">
                        <Check className="w-3 h-3" /> On Time
                      </Badge>
                    )
                  ) : (
                    <Badge variant="outline" className="border-red-500/40 text-red-600 font-bold text-[10px] sm:text-[11px] px-2 py-0.5 flex-shrink-0">
                      Absent
                    </Badge>
                  )}
                </div>

                {/* Phone & Check-in timestamp */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60 text-muted-foreground">
                  {member.phone ? (
                    <a
                      href={`tel:${member.phone}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                    >
                      <Phone className="w-3 h-3" />
                      {member.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground/60">No phone</span>
                  )}

                  {member.scannedAt && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(member.scannedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>

                {/* 1-Tap Check-In Action Button */}
                <div className="pt-1">
                  {member.isPresent ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-emerald-500/10 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/20 font-bold text-xs h-10 rounded-xl"
                      onClick={() => handleToggleCheckIn(member)}
                      disabled={updatingId === member.id}
                    >
                      {updatingId === member.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" />
                          Checked In ({member.isLate ? "LATE" : "ON TIME"}) — Tap to Undo
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm h-10 rounded-xl shadow-md gap-2"
                      onClick={() => handleToggleCheckIn(member)}
                      disabled={updatingId === member.id}
                    >
                      {updatingId === member.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          {isBusSession ? "Board Bus Now" : "Check IN"}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Advance to Next Session Banner */}
      {nextSession && (
        <div className="w-full bg-gradient-to-r from-card via-primary/5 to-card border-2 border-primary/30 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md mt-6">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Up Next in Camp Schedule
            </span>
            <h4 className="text-sm sm:text-base font-black text-foreground">
              {nextSession.name}
            </h4>
            <p className="text-xs text-muted-foreground">
              Finished with {currentSessionDef?.shortLabel || "this session"}? Click to advance and automatically select {nextSession.shortLabel}.
            </p>
          </div>

          <Button
            onClick={() => switchSession(nextSession.name)}
            className="bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm h-11 px-5 rounded-xl shadow-lg gap-2 self-stretch sm:self-auto flex-shrink-0"
          >
            <span>Advance to {nextSession.shortLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
