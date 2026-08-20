"use client"

import React, { useState, useEffect, useRef } from "react"
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  QrCode,
  CheckCircle2,
  Users,
  Search,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  Utensils,
} from "lucide-react"

interface AttendanceRecord {
  id: string
  session: string
  isPresent: boolean
  scannedAt: string
  member: {
    id: string
    badgeId: string
    fullName: string
    phone: string | null
    branch: string | null
    caregroup: string | null
    room: string | null
    position: string
    paid: boolean
  }
}

const DEFAULT_SESSIONS = [
  "Opening Night Rally",
  "Day 1 — Morning Session",
  "Day 1 — Evening Session",
  "Day 2 — Morning Session",
  "Day 2 — Evening Session",
  "Day 3 — Impartation Service",
  "Meal — Breakfast",
  "Meal — Lunch",
  "Meal — Dinner",
]

export function CampAttendanceClient() {
  const [session, setSession] = useState(DEFAULT_SESSIONS[0])
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [badgeQuery, setBadgeQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState<AttendanceRecord["member"] | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/camp/attendance?session=${encodeURIComponent(session)}`)
      const data = await res.json()
      if (data.success) setRecords(data.data)
    } catch (err) {
      toast.error("Failed to load attendance records")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [session])

  const handleCheckIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!badgeQuery.trim()) return

    try {
      setScanning(true)
      const res = await fetch("/api/camp/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          badgeOrId: badgeQuery.trim(),
          session,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(data.message)
        setLastScanned(data.data.member)
        setBadgeQuery("")
        fetchRecords()
      } else {
        toast.error(data.error || "Check-in failed")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setScanning(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              MOR Camp Check-In Desk
            </span>
            <span className="text-xs text-muted-foreground">Mercy Prayer Mountain</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-foreground">
            Attendance & QR Scanner
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Scan attendee QR badges or enter badge IDs to record session and meal check-ins.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Select value={session} onValueChange={setSession}>
            <SelectTrigger className="w-[230px] font-semibold bg-background border-primary/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_SESSIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={fetchRecords} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Check-in Input Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border shadow-sm p-6 bg-card">
          <form onSubmit={handleCheckIn} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center justify-between">
                <span>Scan QR or Enter Badge ID / Phone</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Active Session: <strong className="text-primary">{session}</strong>
                </span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <QrCode className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    placeholder="Scan QR code or type MOR-001..."
                    value={badgeQuery}
                    onChange={(e) => setBadgeQuery(e.target.value)}
                    className="pl-10 h-12 text-base font-medium font-mono"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="bg-primary text-white h-12 px-6 font-bold shadow-md gap-2"
                  disabled={scanning || !badgeQuery.trim()}
                >
                  {scanning ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Check In <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: Standard USB and Bluetooth handheld barcode/QR scanners type the badge ID and press enter automatically.
            </p>
          </form>
        </Card>

        {/* Live Feedback Card */}
        <Card className="border shadow-sm p-6 bg-gradient-to-br from-card to-muted/20 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Last Scanned Attendee
            </div>
            {lastScanned ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-foreground">
                    {lastScanned.fullName}
                  </span>
                  <Badge className="bg-emerald-500 text-white font-mono text-xs">
                    {lastScanned.badgeId}
                  </Badge>
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div>Branch: <strong className="text-foreground">{lastScanned.branch || "—"}</strong></div>
                  <div>Group: <strong className="text-purple-600">{lastScanned.caregroup || "Unassigned"}</strong></div>
                  <div>Room: <strong className="text-amber-600">{lastScanned.room || "No Room"}</strong></div>
                </div>
                <div className="pt-1 flex items-center gap-1 text-emerald-600 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" /> Checked In for {session}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground/60 text-xs">
                Ready for next attendee scan...
              </div>
            )}
          </div>

          <div className="border-t pt-3 mt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Session Total</span>
            <span className="text-base font-black text-primary">{records.length} Scanned</span>
          </div>
        </Card>
      </div>

      {/* Scanned Attendees Table */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="p-4 bg-muted/20 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">
              Attendees Present ({records.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Check-in records for {session}
            </CardDescription>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[100px]">Badge ID</TableHead>
                <TableHead>Attendee</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Time Scanned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading records...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No delegates checked in for this session yet.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono font-bold text-xs text-primary">
                      {r.member.badgeId}
                    </TableCell>
                    <TableCell className="font-bold text-foreground">
                      {r.member.fullName}
                    </TableCell>
                    <TableCell className="text-xs">{r.member.branch || "—"}</TableCell>
                    <TableCell>
                      {r.member.caregroup ? (
                        <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-700">
                          {r.member.caregroup}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{r.member.room || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(r.scannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
