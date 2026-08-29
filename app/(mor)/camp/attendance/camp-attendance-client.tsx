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
  QrCode,
  CheckCircle2,
  XCircle,
  Users,
  Search,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  Bus,
  CalendarDays,
  FileDown,
  Filter,
  Phone,
  Building2,
  Layers,
  Check,
  Undo2,
  Plus,
  Flame,
  ShieldCheck,
  AlertTriangle,
  UserPlus,
  CreditCard,
} from "lucide-react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

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
  scannedAt: string | null
  attendanceId: string | null
}

interface AttendanceSummary {
  totalMembers: number
  presentCount: number
  absentCount: number
  presentPercent: number
  branchBreakdown: Record<string, { total: number; present: number }>
  groupBreakdown: Record<string, { total: number; present: number }>
}

const SCHEDULED_PROGRAMS = [
  {
    category: "Tuesday — Departure & Arrival",
    sessions: [
      "Tuesday — Bus Boarding (Departure Check-In)",
      "Tuesday — Campground Arrival & Lodging Registration",
    ],
  },
  {
    category: "Day 1 — Tuesday Evening & Wednesday",
    sessions: [
      "Tuesday — Opening Night Rally (7:00 PM)",
      "Wednesday — Morning Devotion & Prayer (6:00 AM)",
      "Wednesday — Morning Word & Workshop (9:30 AM)",
      "Wednesday — Afternoon Seminar (3:00 PM)",
      "Wednesday — Evening Revival Session (7:00 PM)",
    ],
  },
  {
    category: "Day 2 — Thursday",
    sessions: [
      "Thursday — Morning Devotion & Prayer (6:00 AM)",
      "Thursday — Leadership & Ministry Impartation (9:30 AM)",
      "Thursday — Praise & Worship Celebration (7:00 PM)",
    ],
  },
  {
    category: "Day 3 — Friday (Final Day)",
    sessions: [
      "Friday — Morning Devotion (6:00 AM)",
      "Friday — Anointing & Commissioning Service (9:30 AM)",
      "Friday — Camp Departure / Return Buses (2:00 PM)",
    ],
  },
  {
    category: "Camp Dining & Meals",
    sessions: ["Meal — Breakfast", "Meal — Lunch", "Meal — Dinner"],
  },
]

export function CampAttendanceClient() {
  const [activeTab, setActiveTab] = useState<"bus" | "program">("bus")
  const [currentSession, setCurrentSession] = useState<string>(
    "Tuesday — Bus Boarding (Departure Check-In)"
  )
  const [members, setMembers] = useState<CampRosterMember[]>([])
  const [summary, setSummary] = useState<AttendanceSummary>({
    totalMembers: 0,
    presentCount: 0,
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

  // Program Table Search & Filters
  const [programSearch, setProgramSearch] = useState("")
  const [filterBranch, setFilterBranch] = useState("ALL")
  const [filterGroup, setFilterGroup] = useState("ALL")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PRESENT" | "ABSENT">("ALL")

  // Quick Barcode / Scanner
  const [scanQuery, setScanQuery] = useState("")
  const [lastScanned, setLastScanned] = useState<CampRosterMember | null>(null)
  const [scanning, setScanning] = useState(false)

  // Custom Session Modal
  const [customSessionOpen, setCustomSessionOpen] = useState(false)
  const [customSessionName, setCustomSessionName] = useState("")

  // Quick On-The-Spot Registration Modal (for unregistered arrivals at the bus)
  const [quickRegOpen, setQuickRegOpen] = useState(false)
  const [quickRegForm, setQuickRegForm] = useState({
    fullName: "",
    phone: "",
    gender: "Male",
    branch: "Headquarters",
    position: "Member",
  })
  const [quickRegSubmitting, setQuickRegSubmitting] = useState(false)

  const nameInputRef = useRef<HTMLInputElement>(null)
  const scanInputRef = useRef<HTMLInputElement>(null)

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

  // Single Member Toggle Check-In
  const handleToggleCheckIn = async (member: CampRosterMember) => {
    const nextPresent = !member.isPresent
    setUpdatingId(member.id)

    // Optimistic UI update
    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? {
              ...m,
              isPresent: nextPresent,
              scannedAt: nextPresent ? new Date().toISOString() : null,
            }
          : m
      )
    )

    setSummary((prev) => {
      const newPresent = prev.presentCount + (nextPresent ? 1 : -1)
      const newAbsent = prev.totalMembers - newPresent
      const newPercent =
        prev.totalMembers > 0 ? Math.round((newPresent / prev.totalMembers) * 100) : 0
      return {
        ...prev,
        presentCount: newPresent,
        absentCount: newAbsent,
        presentPercent: newPercent,
      }
    })

    try {
      const res = await fetch("/api/camp/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          session: currentSession,
          isPresent: nextPresent,
        }),
      })
      const json = await res.json()

      if (json.success) {
        if (nextPresent) {
          toast.success(`✅ ${member.fullName} checked in!`)
          setLastScanned(member)
        } else {
          toast.info(`↩️ ${member.fullName} check-in undone`)
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

  // Quick Scanner / Barcode / Text Submit
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanQuery.trim()) return

    setScanning(true)
    try {
      const res = await fetch("/api/camp/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          badgeOrId: scanQuery.trim(),
          session: currentSession,
          isPresent: true,
        }),
      })
      const json = await res.json()

      if (json.success) {
        toast.success(`✅ ${json.data.member.fullName} checked in!`)
        setLastScanned(json.data.member)
        setScanQuery("")
        fetchAttendance()
      } else {
        toast.error(json.error || "Attendee not found")
      }
    } catch (err) {
      toast.error("Scan error occurred")
    } finally {
      setScanning(false)
      scanInputRef.current?.focus()
    }
  }

  // Quick On-The-Spot Registration at the Bus Door
  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickRegForm.fullName.trim()) {
      toast.error("Please enter attendee full name")
      return
    }

    setQuickRegSubmitting(true)
    try {
      // 1. Create Member
      const regRes = await fetch("/api/camp/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...quickRegForm,
          paid: true,
          paidAmount: 300,
          paymentClaimed: true,
        }),
      })
      const regData = await regRes.json()

      if (!regData.success) {
        toast.error(regData.error || "Registration failed")
        return
      }

      const newMember = regData.data

      // 2. Immediately Check them into the Bus
      await fetch("/api/camp/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: newMember.id,
          session: currentSession,
          isPresent: true,
        }),
      })

      toast.success(`🎉 Registered & Boarded: ${newMember.fullName} (${newMember.badgeId})`)
      setQuickRegOpen(false)
      setNameQuery(newMember.fullName)
      setQuickRegForm({
        fullName: "",
        phone: "",
        gender: "Male",
        branch: "Headquarters",
        position: "Member",
      })
      await fetchAttendance()
    } catch (err) {
      toast.error("An error occurred during quick registration")
    } finally {
      setQuickRegSubmitting(false)
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
      if (filterStatus === "PRESENT" && !m.isPresent) return false
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

  // Export PDF Attendance Sheet
  const handleExportPDF = () => {
    if (members.length === 0) {
      toast.error("No records to export")
      return
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

    // Header
    doc.setFillColor(15, 23, 42) // #0F172A
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
    doc.setFontSize(9)
    doc.text(
      `Total: ${summary.totalMembers}  |  Present: ${summary.presentCount} (${summary.presentPercent}%)  |  Absent: ${summary.absentCount}`,
      14,
      33
    )

    const tableRows = members.map((m, idx) => [
      String(idx + 1),
      m.badgeId,
      m.fullName,
      m.branch || "—",
      m.caregroup || "—",
      m.isPresent ? "PRESENT" : "ABSENT",
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
          if (data.cell.raw === "PRESENT") {
            data.cell.styles.textColor = [16, 185, 129] // Emerald
          } else {
            data.cell.styles.textColor = [239, 68, 68] // Red
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
      m.isPresent ? "PRESENT" : "ABSENT",
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
    <div className="space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              MOR Camp 2026 Registration & Attendance
            </span>
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Live System Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Attendance & Bus Check-In Desk
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Verify member registrations and board departure buses on Tuesday, and record attendance across all camp programs.
          </p>
        </div>

        {/* Session Selector */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
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
            <SelectTrigger className="w-full sm:w-[290px] h-11 font-bold bg-background border-primary/40 text-xs sm:text-sm shadow-sm rounded-xl">
              <CalendarDays className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[380px]">
              {SCHEDULED_PROGRAMS.map((group) => (
                <SelectGroup key={group.category}>
                  <SelectLabel className="text-[11px] font-black text-primary uppercase tracking-wider px-2 py-1.5">
                    {group.category}
                  </SelectLabel>
                  {group.sessions.map((sess) => (
                    <SelectItem key={sess} value={sess} className="text-xs font-semibold py-2">
                      {sess}
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
            className="h-11 px-3.5 rounded-xl border-border hover:bg-muted/50"
            onClick={() => fetchAttendance()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as any)}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-3">
          <TabsList className="bg-muted/60 p-1 rounded-2xl h-12">
            <TabsTrigger
              value="bus"
              className="gap-2 px-4 rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white shadow-sm"
              onClick={() => {
                setTimeout(() => nameInputRef.current?.focus(), 100)
              }}
            >
              <Bus className="w-4 h-4" />
              Tuesday Bus Name Check-In
            </TabsTrigger>
            <TabsTrigger
              value="program"
              className="gap-2 px-4 rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white shadow-sm"
            >
              <CalendarDays className="w-4 h-4" />
              Program Attendance Sheet
            </TabsTrigger>
          </TabsList>

          {/* Quick PDF & CSV Export */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 font-bold text-xs h-9 rounded-xl border-border hover:bg-muted/60"
              onClick={handleExportCSV}
            >
              <FileDown className="w-3.5 h-3.5 text-blue-500" />
              Export CSV
            </Button>
            <Button
              size="sm"
              className="gap-1.5 font-bold text-xs h-9 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
              onClick={handleExportPDF}
            >
              <FileDown className="w-3.5 h-3.5 text-teal-400" />
              Print Roster (PDF)
            </Button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODE 1: TUESDAY BUS NAME CHECK-IN & REGISTRATION VERIFY */}
        {/* ======================================================== */}
        <TabsContent value="bus" className="space-y-6 m-0">
          {/* Boarding Counter Gauge Card */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl ring-1 ring-emerald-500/40">
                    <Bus className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                      Tuesday Departure Gate
                    </div>
                    <div className="text-lg sm:text-xl font-black text-slate-100">
                      Member Name Registration & Boarding Check
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700">
                  <span className="text-3xl font-black text-emerald-400">
                    {summary.presentCount}
                  </span>
                  <span className="text-sm font-bold text-slate-400">
                    / {summary.totalMembers} Boarded
                  </span>
                  <span className="text-xs font-black text-primary ml-1 bg-primary/20 px-2 py-0.5 rounded-full">
                    {summary.presentPercent}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-3.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-primary rounded-full transition-all duration-500"
                    style={{ width: `${summary.presentPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-semibold px-1">
                  <span>{summary.absentCount} Delegates remaining to arrive</span>
                  <span>{summary.presentCount} Verified & on the bus</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Name Verification Search Panel */}
          <div className="bg-card p-6 rounded-2xl border-2 border-primary/30 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Enter Member Name to Check Registration
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  When a delegate calls their name, type it here to verify if they are registered and paid in the system.
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="self-start sm:self-auto gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 font-bold text-xs rounded-xl"
                onClick={() => {
                  setQuickRegForm({
                    ...quickRegForm,
                    fullName: nameQuery.trim(),
                  })
                  setQuickRegOpen(true)
                }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register New Attendee
              </Button>
            </div>

            <div className="relative">
              <Input
                ref={nameInputRef}
                placeholder="Type member name (e.g. Israel Kai Kai, Sattu, Konima)..."
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                className="h-14 pl-4 pr-24 text-base sm:text-xl font-bold bg-background border-2 border-primary/50 rounded-2xl shadow-inner text-foreground placeholder:text-muted-foreground/60"
                autoFocus
              />
              {nameQuery && (
                <button
                  onClick={() => {
                    setNameQuery("")
                    nameInputRef.current?.focus()
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-xl border"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Live Name Verification Feedback Cards */}
            {nameQuery.trim().length > 0 && (
              <div className="pt-2">
                {nameSearchResults.length === 0 ? (
                  /* NOT REGISTERED WARNING */
                  <div className="bg-red-500/10 border-2 border-red-500/40 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-red-500/20 text-red-600 rounded-xl flex-shrink-0 mt-0.5">
                        <XCircle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-base sm:text-lg font-black text-red-600">
                          NOT REGISTERED IN THE SYSTEM
                        </div>
                        <div className="text-xs sm:text-sm text-foreground">
                          No registration record was found for{" "}
                          <strong className="text-red-600 font-bold">&quot;{nameQuery}&quot;</strong>.
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Please verify spelling or register them immediately below so they can be assigned and boarded.
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-red-500/20">
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5 rounded-xl shadow-md"
                        onClick={() => {
                          setQuickRegForm({
                            ...quickRegForm,
                            fullName: nameQuery.trim(),
                          })
                          setQuickRegOpen(true)
                        }}
                      >
                        <UserPlus className="w-4 h-4" />
                        Register &quot;{nameQuery}&quot; Now
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs font-semibold"
                        onClick={() => setNameQuery("")}
                      >
                        Try Another Name
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* REGISTERED MEMBER(S) FOUND */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-600 px-1">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        {nameSearchResults.length} Registered Member{nameSearchResults.length > 1 ? "s" : ""} Found Matching &quot;{nameQuery}&quot;
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {nameSearchResults.map((member) => (
                        <Card
                          key={member.id}
                          className={`border-2 transition-all shadow-md rounded-2xl overflow-hidden ${
                            member.isPresent
                              ? "bg-emerald-500/10 border-emerald-500/60"
                              : "bg-emerald-500/[0.03] border-emerald-500/40 hover:border-emerald-500/80"
                          }`}
                        >
                          <CardContent className="p-5 space-y-3.5">
                            {/* Member Details */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-emerald-600 text-white font-mono text-xs font-bold">
                                    {member.badgeId}
                                  </Badge>
                                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                                    ✅ REGISTERED
                                  </span>
                                </div>
                                <h3 className="text-lg font-black text-foreground pt-1">
                                  {member.fullName}
                                </h3>
                              </div>

                              {member.isPresent ? (
                                <Badge className="bg-emerald-500 text-white font-bold text-xs px-2.5 py-1 flex items-center gap-1 shadow-sm">
                                  <Check className="w-3.5 h-3.5" /> ON BUS
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-amber-500/50 text-amber-600 font-bold text-xs px-2.5 py-1 bg-amber-500/10">
                                  WAITING
                                </Badge>
                              )}
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs bg-background/80 p-3 rounded-xl border border-border/60">
                              <div>
                                <span className="text-muted-foreground text-[10px] uppercase font-bold block">Branch</span>
                                <strong className="text-foreground font-bold">{member.branch || "HQ"}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground text-[10px] uppercase font-bold block">Fellowship Group</span>
                                <strong className="text-purple-600 font-bold">{member.caregroup || "Unassigned"}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground text-[10px] uppercase font-bold block">Role / Position</span>
                                <span className="text-foreground font-semibold">{member.position || "Member"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground text-[10px] uppercase font-bold block">Payment</span>
                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                  <CreditCard className="w-3 h-3" /> Paid (300 NLE)
                                </span>
                              </div>
                            </div>

                            {/* 1-Tap Boarding Action */}
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
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2" />
                                      Already Boarded (Tap to Undo)
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
                                      <Bus className="w-5 h-5" />
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
          <div className="space-y-4">
            <div className="bg-card p-4 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={busFilter === "ALL" ? "default" : "outline"}
                  className="rounded-xl text-xs font-bold h-9"
                  onClick={() => setBusFilter("ALL")}
                >
                  All Registered Delegates ({members.length})
                </Button>
                <Button
                  size="sm"
                  variant={busFilter === "UNBOARDED" ? "default" : "outline"}
                  className={`rounded-xl text-xs font-bold h-9 ${
                    busFilter === "UNBOARDED"
                      ? "bg-amber-500 hover:bg-amber-600 text-black"
                      : "border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
                  }`}
                  onClick={() => setBusFilter("UNBOARDED")}
                >
                  ⏳ Not Boarded Yet ({summary.absentCount})
                </Button>
                <Button
                  size="sm"
                  variant={busFilter === "BOARDED" ? "default" : "outline"}
                  className={`rounded-xl text-xs font-bold h-9 ${
                    busFilter === "BOARDED"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                  }`}
                  onClick={() => setBusFilter("BOARDED")}
                >
                  ✅ Boarded ({summary.presentCount})
                </Button>
              </div>

              <div className="text-xs text-muted-foreground font-semibold">
                Showing {busFilteredMembers.length} delegates
              </div>
            </div>

            {/* Attendee Roster Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {busFilteredMembers.map((member) => (
                <Card
                  key={member.id}
                  className={`border transition-all duration-200 shadow-sm overflow-hidden flex flex-col justify-between ${
                    member.isPresent
                      ? "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/60"
                      : "bg-card hover:border-primary/40"
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-black text-base text-foreground truncate">
                          {member.fullName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
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
                        <Badge className="bg-emerald-500 text-white font-bold text-[11px] px-2 py-0.5 flex-shrink-0 flex items-center gap-1">
                          <Check className="w-3 h-3" /> On Bus
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500/40 text-amber-600 font-bold text-[11px] px-2 py-0.5 flex-shrink-0">
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
                          onClick={() => handleToggleCheckIn(member)}
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
                          onClick={() => handleToggleCheckIn(member)}
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
        {/* MODE 2: CAMPGROUND PROGRAM ATTENDANCE SHEET */}
        {/* ======================================================== */}
        <TabsContent value="program" className="space-y-6 m-0">
          {/* Quick Scanner & Stats Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Barcode / Name Input Card */}
            <Card className="lg:col-span-2 border shadow-sm p-5 bg-card">
              <form onSubmit={handleScanSubmit} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Barcode Scan / Badge ID / Name Check-In
                  </label>
                  <Badge variant="outline" className="text-[11px] font-semibold text-primary">
                    Active: {currentSession}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <QrCode className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={scanInputRef}
                      placeholder="Scan badge barcode or type MOR-001..."
                      value={scanQuery}
                      onChange={(e) => setScanQuery(e.target.value)}
                      className="pl-11 h-12 text-sm sm:text-base font-bold font-mono bg-background border-primary/40 rounded-xl"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-12 px-6 bg-primary text-white font-bold text-xs sm:text-sm shadow-md rounded-xl"
                    disabled={scanning || !scanQuery.trim()}
                  >
                    {scanning ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Check In <ArrowRight className="w-4 h-4 ml-1.5" />
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Works seamlessly with Bluetooth barcode scanners, or type attendee names / badge IDs.
                </p>
              </form>
            </Card>

            {/* Quick Live Stats Widget */}
            <Card className="border shadow-sm p-5 bg-gradient-to-br from-card to-muted/30 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Session Attendance Rate
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-foreground">
                    {summary.presentCount}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    of {summary.totalMembers} delegates
                  </span>
                </div>
                <Progress value={summary.presentPercent} className="h-2.5 bg-muted" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/80 text-xs">
                <div className="bg-emerald-500/10 p-2 rounded-xl text-center">
                  <div className="text-emerald-600 font-bold">{summary.presentCount}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold">PRESENT</div>
                </div>
                <div className="bg-red-500/10 p-2 rounded-xl text-center">
                  <div className="text-red-600 font-bold">{summary.absentCount}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold">ABSENT</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-card p-4 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter by name, badge ID..."
                  value={programSearch}
                  onChange={(e) => setProgramSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>

              {/* Branch Filter */}
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl font-semibold">
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
                <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl font-semibold">
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
                <SelectTrigger className="w-[130px] h-9 text-xs rounded-xl font-semibold">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PRESENT">🟢 Present</SelectItem>
                  <SelectItem value="ABSENT">🔴 Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-muted-foreground font-semibold">
              {programFilteredMembers.length} delegates listed
            </div>
          </div>

          {/* Roll Call Interactive Table */}
          <Card className="border shadow-sm overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50 border-b">
                  <TableRow>
                    <TableHead className="w-[90px] text-xs font-bold">Badge ID</TableHead>
                    <TableHead className="text-xs font-bold">Attendee Name</TableHead>
                    <TableHead className="text-xs font-bold">Branch</TableHead>
                    <TableHead className="text-xs font-bold">Group</TableHead>
                    <TableHead className="text-xs font-bold">Role</TableHead>
                    <TableHead className="text-xs font-bold">Time</TableHead>
                    <TableHead className="text-right text-xs font-bold w-[140px]">
                      Attendance Action
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
                          member.isPresent ? "bg-emerald-500/[0.03]" : ""
                        }`}
                      >
                        <TableCell className="font-mono font-bold text-xs text-primary">
                          {member.badgeId}
                        </TableCell>
                        <TableCell className="font-bold text-foreground">
                          {member.fullName}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {member.branch || "—"}
                        </TableCell>
                        <TableCell>
                          {member.caregroup ? (
                            <Badge
                              variant="secondary"
                              className="text-[11px] font-semibold bg-purple-500/10 text-purple-700"
                            >
                              {member.caregroup}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground">
                          {member.position || "Member"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {member.scannedAt ? (
                            <span className="flex items-center gap-1 font-semibold text-emerald-600">
                              <Clock className="w-3 h-3" />
                              {new Date(member.scannedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={member.isPresent ? "outline" : "default"}
                            className={`h-8 px-3 rounded-xl text-xs font-bold transition-all ${
                              member.isPresent
                                ? "border-emerald-500/40 text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20"
                                : "bg-primary hover:bg-primary/90 text-white"
                            }`}
                            onClick={() => handleToggleCheckIn(member)}
                            disabled={updatingId === member.id}
                          >
                            {updatingId === member.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : member.isPresent ? (
                              <>
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Present
                              </>
                            ) : (
                              "Mark Present"
                            )}
                          </Button>
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

      {/* Quick On-The-Spot Registration Dialog */}
      <Dialog open={quickRegOpen} onOpenChange={setQuickRegOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Quick Attendee Registration
            </DialogTitle>
            <DialogDescription>
              Register an attendee on the spot and immediately admit them to the Tuesday departure bus.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickRegister} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Full Name *
              </label>
              <Input
                placeholder="e.g. John Doe"
                value={quickRegForm.fullName}
                onChange={(e) =>
                  setQuickRegForm({ ...quickRegForm, fullName: e.target.value })
                }
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Phone Number
                </label>
                <Input
                  placeholder="+232..."
                  value={quickRegForm.phone}
                  onChange={(e) =>
                    setQuickRegForm({ ...quickRegForm, phone: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Gender
                </label>
                <Select
                  value={quickRegForm.gender}
                  onValueChange={(val) =>
                    setQuickRegForm({ ...quickRegForm, gender: val })
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sending Branch
                </label>
                <Select
                  value={quickRegForm.branch}
                  onValueChange={(val) =>
                    setQuickRegForm({ ...quickRegForm, branch: val })
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Headquarters">Headquarters</SelectItem>
                    <SelectItem value="Eastern">Eastern</SelectItem>
                    <SelectItem value="Bo">Bo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Role
                </label>
                <Select
                  value={quickRegForm.position}
                  onValueChange={(val) =>
                    setQuickRegForm({ ...quickRegForm, position: val })
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="Leader">Leader</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuickRegOpen(false)}
                disabled={quickRegSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                disabled={quickRegSubmitting}
              >
                {quickRegSubmitting ? "Registering..." : "Register & Board Bus"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Custom Session Dialog */}
      <Dialog open={customSessionOpen} onOpenChange={setCustomSessionOpen}>
        <DialogContent className="max-w-md bg-card">
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
