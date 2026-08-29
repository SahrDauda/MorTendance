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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  CheckCircle2,
  XCircle,
  Users,
  Search,
  RefreshCw,
  Clock,
  Bus,
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
  ClipboardCheck,
} from "lucide-react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { CAMP_SCHEDULE, CampSessionDef, getSessionDef } from "@/lib/campSchedule"

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
  const [activeTab, setActiveTab] = useState<"bus" | "program">("bus")
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

  // Tuesday Bus Search & Name Lookup
  const [nameQuery, setNameQuery] = useState("")
  const [busFilter, setBusFilter] = useState<"ALL" | "UNBOARDED" | "BOARDED">("ALL")

  // Program / Session Search & Filters
  const [programSearch, setProgramSearch] = useState("")
  const [filterBranch, setFilterBranch] = useState("ALL")
  const [filterGroup, setFilterGroup] = useState("ALL")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ON_TIME" | "LATE" | "ABSENT">("ALL")

  // Custom Session Modal
  const [customSessionOpen, setCustomSessionOpen] = useState(false)
  const [customSessionName, setCustomSessionName] = useState("")

  const nameInputRef = useRef<HTMLInputElement>(null)
  const programInputRef = useRef<HTMLInputElement>(null)

  const currentSessionDef = useMemo(() => {
    return getSessionDef(currentSession)
  }, [currentSession])

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

  // Single Member Check-In / Status Update
  const handleSetStatus = async (
    member: CampRosterMember,
    status: "ON_TIME" | "LATE" | "ABSENT"
  ) => {
    setUpdatingId(member.id)

    const nextPresent = status !== "ABSENT"
    const nextLate = status === "LATE"

    // Optimistic UI update
    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? {
              ...m,
              isPresent: nextPresent,
              isLate: nextLate,
              scannedAt: nextPresent ? new Date().toISOString() : null,
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
          isPresent: nextPresent,
          isLate: nextLate,
        }),
      })
      const json = await res.json()

      if (json.success) {
        if (nextPresent) {
          if (nextLate) {
            toast.warning(`⚠️ ${member.fullName} marked as LATE`)
          } else {
            toast.success(`✅ ${member.fullName} marked ON TIME`)
          }
        } else {
          toast.info(`↩️ ${member.fullName} marked ABSENT`)
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

  // Search Results for Tuesday Name Lookup
  const nameSearchResults = useMemo(() => {
    if (!nameQuery.trim()) return []
    const q = nameQuery.toLowerCase().trim()

    return members.filter((m) => {
      const matchName = m.fullName.toLowerCase().includes(q)
      const matchBadge = m.badgeId.toLowerCase().includes(q)
      const matchPhone = (m.phone || "").toLowerCase().includes(q)
      return matchName || matchBadge || matchPhone
    })
  }, [members, nameQuery])

  // Search Results for Program Session Name Lookup
  const programSearchResults = useMemo(() => {
    if (!programSearch.trim()) return []
    const q = programSearch.toLowerCase().trim()

    return members.filter((m) => {
      const matchName = m.fullName.toLowerCase().includes(q)
      const matchBadge = m.badgeId.toLowerCase().includes(q)
      const matchPhone = (m.phone || "").toLowerCase().includes(q)
      return matchName || matchBadge || matchPhone
    })
  }, [members, programSearch])

  // Filtered members for Bus Boarding List
  const busFilteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (busFilter === "UNBOARDED" && m.isPresent) return false
      if (busFilter === "BOARDED" && !m.isPresent) return false

      if (nameQuery.trim()) {
        const q = nameQuery.toLowerCase().trim()
        const matchName = m.fullName.toLowerCase().includes(q)
        const matchBadge = m.badgeId.toLowerCase().includes(q)
        const matchPhone = (m.phone || "").toLowerCase().includes(q)
        if (!matchName && !matchBadge && !matchPhone) return false
      }
      return true
    })
  }, [members, busFilter, nameQuery])

  // Filtered members for Campground Program Table
  const programFilteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (filterStatus === "ON_TIME" && (!m.isPresent || m.isLate)) return false
      if (filterStatus === "LATE" && (!m.isPresent || !m.isLate)) return false
      if (filterStatus === "ABSENT" && m.isPresent) return false
      if (filterBranch !== "ALL" && (m.branch || "Unassigned") !== filterBranch) return false
      if (filterGroup !== "ALL" && (m.caregroup || "Unassigned") !== filterGroup) return false

      if (programSearch.trim()) {
        const q = programSearch.toLowerCase()
        const matchName = m.fullName.toLowerCase().includes(q)
        const matchBadge = m.badgeId.toLowerCase().includes(q)
        const matchPhone = (m.phone || "").toLowerCase().includes(q)
        if (!matchName && !matchBadge && !matchPhone) return false
      }
      return true
    })
  }, [members, filterStatus, filterBranch, filterGroup, programSearch])

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

    // Header
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

    // Summary Box
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

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6 pb-24 sm:pb-12 overflow-x-hidden">
      {/* Top Header Card */}
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
            Search member names to check in for Tuesday departure buses, and record program attendance across campground sessions.
          </p>
        </div>

        {/* Schedule Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select
            value={currentSession}
            onValueChange={(val) => {
              if (val === "__CUSTOM__") {
                setCustomSessionOpen(true)
              } else {
                setCurrentSession(val)
                if (val.includes("Bus")) {
                  setActiveTab("bus")
                }
              }
            }}
          >
            <SelectTrigger className="flex-1 sm:w-[320px] h-11 font-bold bg-background border-primary/40 text-xs sm:text-sm shadow-sm rounded-xl">
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
              <SelectGroup>
                <SelectItem value="__CUSTOM__" className="text-xs font-bold text-amber-600">
                  ➕ Add Custom Program Session...
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

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

      {/* Mode Switcher Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as any)}
        className="w-full max-w-full space-y-4 sm:space-y-6"
      >
        <div className="w-full max-w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
          <TabsList className="bg-muted/60 p-1 rounded-2xl h-12 w-full sm:w-auto grid grid-cols-2 sm:flex">
            <TabsTrigger
              value="bus"
              className="gap-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white shadow-sm"
              onClick={() => {
                setTimeout(() => nameInputRef.current?.focus(), 100)
              }}
            >
              <Bus className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Tuesday Bus</span>
            </TabsTrigger>
            <TabsTrigger
              value="program"
              className="gap-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white shadow-sm"
              onClick={() => {
                setTimeout(() => programInputRef.current?.focus(), 100)
              }}
            >
              <CalendarDays className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Sessions</span>
            </TabsTrigger>
          </TabsList>

          {/* Quick PDF & CSV Export */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none gap-1.5 font-bold text-xs h-9 rounded-xl border-border hover:bg-muted/60"
              onClick={handleExportCSV}
            >
              <FileDown className="w-3.5 h-3.5 text-blue-500" />
              CSV
            </Button>
            <Button
              size="sm"
              className="flex-1 sm:flex-none gap-1.5 font-bold text-xs h-9 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
              onClick={handleExportPDF}
            >
              <FileDown className="w-3.5 h-3.5 text-teal-400" />
              PDF Roster
            </Button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODE 1: TUESDAY BUS NAME CHECK-IN */}
        {/* ======================================================== */}
        <TabsContent value="bus" className="w-full max-w-full space-y-4 sm:space-y-6 m-0">
          {/* Boarding Counter Gauge Card */}
          <div className="w-full max-w-full bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 sm:p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl ring-1 ring-emerald-500/40 flex-shrink-0">
                    <Bus className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest">
                      Tuesday Departure Gate
                    </div>
                    <div className="text-base sm:text-xl font-black text-slate-100">
                      Bus Boarding & Verification
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-700 self-start sm:self-auto">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                    {summary.presentCount}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-400">
                    / {summary.totalMembers} Boarded
                  </span>
                  <span className="text-xs font-black text-primary ml-1 bg-primary/20 px-2 py-0.5 rounded-full">
                    {summary.presentPercent}%
                  </span>
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
                  <span>{summary.absentCount} Remaining to board</span>
                  <span>{summary.presentCount} Verified on bus</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Name Verification Search Panel */}
          <div className="w-full max-w-full bg-card p-4 sm:p-6 rounded-2xl border-2 border-primary/30 shadow-lg space-y-4">
            <div>
              <label className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
                <Search className="w-5 h-5 text-primary flex-shrink-0" />
                Enter Member Name for Bus Check-In
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                When a delegate arrives at the bus, enter their name here to verify their registration and admit them.
              </p>
            </div>

            <div className="relative w-full">
              <Input
                ref={nameInputRef}
                placeholder="Type member name (e.g. Israel Kai Kai, Sattu)..."
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

            {/* Live Name Verification Feedback Cards */}
            {nameQuery.trim().length > 0 && (
              <div className="pt-2 w-full max-w-full">
                {nameSearchResults.length === 0 ? (
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
                          Only pre-registered delegates are permitted to board. Please check spelling.
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
                      <span>{nameSearchResults.length} Registered Member{nameSearchResults.length > 1 ? "s" : ""} Found</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                      {nameSearchResults.map((member) => (
                        <Card
                          key={member.id}
                          className={`w-full border-2 transition-all shadow-md rounded-2xl overflow-hidden ${
                            member.isPresent
                              ? "bg-emerald-500/10 border-emerald-500/60"
                              : "bg-emerald-500/[0.03] border-emerald-500/40 hover:border-emerald-500/80"
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
                                <Badge className="bg-emerald-500 text-white font-bold text-xs px-2.5 py-1 flex items-center gap-1 shadow-sm flex-shrink-0">
                                  <Check className="w-3.5 h-3.5" /> ON BUS
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-amber-500/50 text-amber-600 font-bold text-xs px-2.5 py-1 bg-amber-500/10 flex-shrink-0">
                                  WAITING
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

                            {/* 1-Tap Boarding Action */}
                            <div className="pt-1">
                              {member.isPresent ? (
                                <Button
                                  variant="outline"
                                  className="w-full bg-emerald-500/15 border-emerald-500/50 text-emerald-700 hover:bg-emerald-500/25 font-black text-xs sm:text-sm h-11 rounded-xl"
                                  onClick={() => handleSetStatus(member, "ABSENT")}
                                  disabled={updatingId === member.id}
                                >
                                  {updatingId === member.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
                                      Already Boarded (Tap to Undo)
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm h-12 rounded-xl shadow-lg gap-2"
                                  onClick={() => handleSetStatus(member, "ON_TIME")}
                                  disabled={updatingId === member.id}
                                >
                                  {updatingId === member.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                  ) : (
                                    <>
                                      <Bus className="w-5 h-5 flex-shrink-0" />
                                      Admit to Bus & Board 🚌
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

          {/* Full Delegate Boarding List & Calling Roster */}
          <div className="w-full max-w-full space-y-4">
            <div className="w-full bg-card p-3 sm:p-4 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Button
                  size="sm"
                  variant={busFilter === "ALL" ? "default" : "outline"}
                  className="rounded-xl text-xs font-bold h-8 sm:h-9 px-2.5 sm:px-3"
                  onClick={() => setBusFilter("ALL")}
                >
                  All ({members.length})
                </Button>
                <Button
                  size="sm"
                  variant={busFilter === "UNBOARDED" ? "default" : "outline"}
                  className={`rounded-xl text-xs font-bold h-8 sm:h-9 px-2.5 sm:px-3 ${
                    busFilter === "UNBOARDED"
                      ? "bg-amber-500 hover:bg-amber-600 text-black"
                      : "border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
                  }`}
                  onClick={() => setBusFilter("UNBOARDED")}
                >
                  ⏳ Waiting ({summary.absentCount})
                </Button>
                <Button
                  size="sm"
                  variant={busFilter === "BOARDED" ? "default" : "outline"}
                  className={`rounded-xl text-xs font-bold h-8 sm:h-9 px-2.5 sm:px-3 ${
                    busFilter === "BOARDED"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                  }`}
                  onClick={() => setBusFilter("BOARDED")}
                >
                  ✅ Boarded ({summary.presentCount})
                </Button>
              </div>

              <div className="text-[11px] sm:text-xs text-muted-foreground font-semibold">
                {busFilteredMembers.length} delegates
              </div>
            </div>

            {/* Attendee Roster Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full">
              {busFilteredMembers.map((member) => (
                <Card
                  key={member.id}
                  className={`w-full border transition-all duration-200 shadow-sm overflow-hidden flex flex-col justify-between ${
                    member.isPresent
                      ? "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/60"
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
                        <Badge className="bg-emerald-500 text-white font-bold text-[10px] sm:text-[11px] px-2 py-0.5 flex-shrink-0 flex items-center gap-1">
                          <Check className="w-3 h-3" /> On Bus
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500/40 text-amber-600 font-bold text-[10px] sm:text-[11px] px-2 py-0.5 flex-shrink-0">
                          Waiting
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

                    {/* 1-Tap Action Button */}
                    <div className="pt-1">
                      {member.isPresent ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-emerald-500/10 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/20 font-bold text-xs h-10 rounded-xl"
                          onClick={() => handleSetStatus(member, "ABSENT")}
                          disabled={updatingId === member.id}
                        >
                          {updatingId === member.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" />
                              Boarded (Tap to Undo)
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-sm h-10 rounded-xl shadow-md gap-2"
                          onClick={() => handleSetStatus(member, "ON_TIME")}
                          disabled={updatingId === member.id}
                        >
                          {updatingId === member.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          ) : (
                            <>
                              <Bus className="w-4 h-4" />
                              Board Bus Now
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
        </TabsContent>

        {/* ======================================================== */}
        {/* MODE 2: CAMPGROUND PROGRAM & SESSION NAME ATTENDANCE */}
        {/* ======================================================== */}
        <TabsContent value="program" className="w-full max-w-full space-y-4 sm:space-y-6 m-0">
          {/* Dedicated Name Search & Live Metrics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-full">
            {/* Name Search Box Card for Active Session */}
            <Card className="lg:col-span-2 border-2 border-primary/30 shadow-md p-4 sm:p-5 bg-card space-y-3 sm:space-y-4 w-full">
              <div>
                <label className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary flex-shrink-0" />
                  Search Member Name to Mark Attendance
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Call or search member name to mark attendance for <strong>{currentSessionDef?.shortLabel || currentSession}</strong>.
                </p>
              </div>

              <div className="relative w-full">
                <Input
                  ref={programInputRef}
                  placeholder={`Search attendee name (e.g. Israel, Sattu, Konima)...`}
                  value={programSearch}
                  onChange={(e) => setProgramSearch(e.target.value)}
                  className="h-13 pl-4 pr-20 text-base sm:text-lg font-bold bg-background border-2 border-primary/40 rounded-xl shadow-inner text-foreground placeholder:text-muted-foreground/60 w-full"
                />
                {programSearch && (
                  <button
                    onClick={() => {
                      setProgramSearch("")
                      programInputRef.current?.focus()
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold bg-muted hover:bg-muted/80 text-foreground px-2.5 py-1.5 rounded-lg border"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Instant Search Results Panel for Session */}
              {programSearch.trim().length > 0 && (
                <div className="pt-1 w-full">
                  {programSearchResults.length === 0 ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex items-center justify-between gap-2 text-xs w-full">
                      <span className="text-red-600 font-bold flex items-center gap-1.5 min-w-0">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="truncate">No delegate found matching &quot;{programSearch}&quot;</span>
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs font-bold text-muted-foreground hover:text-foreground flex-shrink-0"
                        onClick={() => setProgramSearch("")}
                      >
                        Clear
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 w-full">
                      <div className="text-xs font-bold text-muted-foreground">
                        Matching Delegates ({programSearchResults.length}):
                      </div>
                      {programSearchResults.map((m) => (
                        <div
                          key={m.id}
                          className={`p-3 sm:p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all w-full ${
                            !m.isPresent
                              ? "bg-muted/30 border-border"
                              : m.isLate
                              ? "bg-amber-500/10 border-amber-500/40"
                              : "bg-emerald-500/10 border-emerald-500/40"
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 w-full sm:w-auto">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-xs text-primary">
                                {m.badgeId}
                              </span>
                              <span className="text-sm font-black text-foreground truncate">
                                {m.fullName}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                              <span>{m.branch || "HQ"}</span>
                              <span>•</span>
                              <span className="text-purple-600 font-semibold">{m.caregroup || "Unassigned"}</span>
                              <span>•</span>
                              <span>{m.position || "Member"}</span>
                            </div>
                          </div>

                          {/* Quick Marking Buttons */}
                          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                            <Button
                              size="sm"
                              className={`h-8 px-2.5 sm:px-3 rounded-xl text-xs font-black gap-1 flex-1 sm:flex-none ${
                                m.isPresent && !m.isLate
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                  : "border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                              }`}
                              onClick={() =>
                                handleSetStatus(
                                  m,
                                  m.isPresent && !m.isLate ? "ABSENT" : "ON_TIME"
                                )
                              }
                              disabled={updatingId === m.id}
                            >
                              <Check className="w-3.5 h-3.5" />
                              {m.isPresent && !m.isLate ? "On Time ✅" : "Mark On Time"}
                            </Button>

                            <Button
                              size="sm"
                              className={`h-8 px-2.5 sm:px-3 rounded-xl text-xs font-black gap-1 flex-1 sm:flex-none ${
                                m.isPresent && m.isLate
                                  ? "bg-amber-500 hover:bg-amber-600 text-black shadow-sm"
                                  : "border border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
                              }`}
                              onClick={() =>
                                handleSetStatus(
                                  m,
                                  m.isPresent && m.isLate ? "ABSENT" : "LATE"
                                )
                              }
                              disabled={updatingId === m.id}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              {m.isPresent && m.isLate ? "Late ⚠️" : "Mark Late"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Quick Live Stats Widget */}
            <Card className="border shadow-sm p-4 sm:p-5 bg-gradient-to-br from-card to-muted/30 flex flex-col justify-between w-full">
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Session Attendance Breakdown
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-foreground">
                    {summary.presentCount}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    of {summary.totalMembers} ({summary.presentPercent}%)
                  </span>
                </div>
                <Progress value={summary.presentPercent} className="h-2.5 bg-muted" />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/80 text-xs text-center">
                <div className="bg-emerald-500/10 p-2 rounded-xl">
                  <div className="text-emerald-600 font-black text-sm">{summary.onTimeCount}</div>
                  <div className="text-[10px] text-muted-foreground font-bold">ON TIME</div>
                </div>
                <div className="bg-amber-500/10 p-2 rounded-xl">
                  <div className="text-amber-600 font-black text-sm">{summary.lateCount}</div>
                  <div className="text-[10px] text-muted-foreground font-bold">LATE</div>
                </div>
                <div className="bg-red-500/10 p-2 rounded-xl">
                  <div className="text-red-600 font-black text-sm">{summary.absentCount}</div>
                  <div className="text-[10px] text-muted-foreground font-bold">ABSENT</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Filter Toolbar */}
          <div className="w-full max-w-full bg-card p-3 sm:p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 flex-1 w-full">
              {/* Search in Table */}
              <div className="relative col-span-2 sm:flex-1 sm:min-w-[180px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter table by name..."
                  value={programSearch}
                  onChange={(e) => setProgramSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl w-full"
                />
              </div>

              {/* Branch Filter */}
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger className="h-9 text-xs rounded-xl font-semibold w-full sm:w-[130px]">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
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
                <SelectTrigger className="h-9 text-xs rounded-xl font-semibold w-full sm:w-[130px]">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
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

              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as any)}>
                <SelectTrigger className="col-span-2 sm:col-span-1 h-9 text-xs rounded-xl font-semibold w-full sm:w-[120px]">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ON_TIME">🟢 On Time</SelectItem>
                  <SelectItem value="LATE">🟡 Late</SelectItem>
                  <SelectItem value="ABSENT">🔴 Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-[11px] sm:text-xs text-muted-foreground font-semibold text-right">
              {programFilteredMembers.length} delegates listed
            </div>
          </div>

          {/* Roll Call Interactive Table */}
          <Card className="w-full max-w-full border shadow-sm overflow-hidden rounded-2xl">
            <div className="overflow-x-auto w-full max-w-full">
              <Table className="w-full">
                <TableHeader className="bg-muted/50 border-b">
                  <TableRow>
                    <TableHead className="w-[80px] text-xs font-bold whitespace-nowrap">Badge ID</TableHead>
                    <TableHead className="text-xs font-bold">Attendee Name</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Branch</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Group</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Time</TableHead>
                    <TableHead className="text-right text-xs font-bold w-[180px] whitespace-nowrap">
                      Quick Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        Loading session roster...
                      </TableCell>
                    </TableRow>
                  ) : programFilteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No attendees match the active filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    programFilteredMembers.map((member) => (
                      <TableRow
                        key={member.id}
                        className={`hover:bg-muted/40 transition-colors ${
                          !member.isPresent
                            ? ""
                            : member.isLate
                            ? "bg-amber-500/[0.04]"
                            : "bg-emerald-500/[0.04]"
                        }`}
                      >
                        <TableCell className="font-mono font-bold text-xs text-primary whitespace-nowrap">
                          {member.badgeId}
                        </TableCell>
                        <TableCell className="font-bold text-foreground">
                          {member.fullName}
                        </TableCell>
                        <TableCell className="text-xs font-medium whitespace-nowrap">
                          {member.branch || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {member.caregroup ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] sm:text-[11px] font-semibold bg-purple-500/10 text-purple-700"
                            >
                              {member.caregroup}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {!member.isPresent ? (
                            <Badge variant="outline" className="text-[10px] font-bold border-red-500/40 text-red-600 bg-red-500/5">
                              🔴 ABSENT
                            </Badge>
                          ) : member.isLate ? (
                            <Badge className="text-[10px] font-bold bg-amber-500 text-black">
                              🟡 LATE
                            </Badge>
                          ) : (
                            <Badge className="text-[10px] font-bold bg-emerald-500 text-white">
                              🟢 ON TIME
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {member.scannedAt ? (
                            <span className="flex items-center gap-1 font-semibold text-foreground">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              {new Date(member.scannedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {/* Mark On-Time Button */}
                            <Button
                              size="sm"
                              variant={member.isPresent && !member.isLate ? "default" : "outline"}
                              className={`h-7 px-2 sm:px-2.5 rounded-lg text-[10px] sm:text-[11px] font-bold ${
                                member.isPresent && !member.isLate
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                  : "border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10"
                              }`}
                              onClick={() =>
                                handleSetStatus(
                                  member,
                                  member.isPresent && !member.isLate ? "ABSENT" : "ON_TIME"
                                )
                              }
                              disabled={updatingId === member.id}
                            >
                              {updatingId === member.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                "On Time"
                              )}
                            </Button>

                            {/* Mark Late Button */}
                            <Button
                              size="sm"
                              variant={member.isPresent && member.isLate ? "default" : "outline"}
                              className={`h-7 px-2 sm:px-2.5 rounded-lg text-[10px] sm:text-[11px] font-bold ${
                                member.isPresent && member.isLate
                                  ? "bg-amber-500 hover:bg-amber-600 text-black shadow-sm"
                                  : "border-amber-500/40 text-amber-700 hover:bg-amber-500/10"
                              }`}
                              onClick={() =>
                                handleSetStatus(
                                  member,
                                  member.isPresent && member.isLate ? "ABSENT" : "LATE"
                                )
                              }
                              disabled={updatingId === member.id}
                            >
                              {updatingId === member.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                "Late"
                              )}
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
        </TabsContent>
      </Tabs>

      {/* Add Custom Session Dialog */}
      <Dialog open={customSessionOpen} onOpenChange={setCustomSessionOpen}>
        <DialogContent className="max-w-md bg-card p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Custom Program Session</DialogTitle>
            <DialogDescription>
              Create a new program or workshop check-in session for MOR Camp 2026.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!customSessionName.trim()) {
                toast.error("Please enter session name")
                return
              }
              setCurrentSession(customSessionName.trim())
              setCustomSessionOpen(false)
              setCustomSessionName("")
              toast.success(`Active session switched to "${customSessionName.trim()}"`)
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Session / Program Name *
              </label>
              <Input
                placeholder="e.g. Wednesday — Choir Rehearsal, Leadership Summit"
                value={customSessionName}
                onChange={(e) => setCustomSessionName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCustomSessionOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white font-bold">
                Set as Active Session
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
