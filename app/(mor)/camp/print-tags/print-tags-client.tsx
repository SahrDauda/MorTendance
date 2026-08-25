"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Printer, Download, ArrowLeft, RefreshCw, Loader2 } from "lucide-react"
import Link from "next/link"
import MorTagFront from "@/components/camp/mor-tag-front"
import { toast } from "sonner"

interface Attendee {
  id: string
  badgeId: string
  fullName: string
  branch: string | null
  caregroup: string | null
  room: string | null
  position: string
  paid: boolean
}

interface CampBranch {
  id: string
  name: string
}

export function PrintTagsClient() {
  const [members, setMembers] = useState<Attendee[]>([])
  const [dbBranches, setDbBranches] = useState<CampBranch[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [groupFilter, setGroupFilter] = useState("ALL")
  const [branchFilter, setBranchFilter] = useState("ALL")

  const printAreaRef = useRef<HTMLDivElement>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [membersRes, branchesRes] = await Promise.all([
        fetch("/api/camp/members"),
        fetch("/api/camp/branches"),
      ])
      const [membersData, branchesData] = await Promise.all([
        membersRes.json(),
        branchesRes.json(),
      ])
      if (membersData.success) setMembers(membersData.data)
      if (branchesData.success) setDbBranches(branchesData.data)
    } catch (err) {
      toast.error("Failed to load attendees")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const groups = useMemo(() => {
    const list = Array.from(new Set(members.map((m) => m.caregroup).filter(Boolean)))
    return list as string[]
  }, [members])

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (groupFilter !== "ALL" && m.caregroup !== groupFilter) return false
      if (branchFilter !== "ALL" && m.branch !== branchFilter) return false
      return true
    })
  }, [members, groupFilter, branchFilter])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return
    setExporting(true)

    try {
      const html2pdf = (await import("html2pdf.js")).default

      const opt = {
        margin: 5,
        filename: `MOR_Camp_2026_Badges_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      }

      await html2pdf().from(printAreaRef.current).set(opt).save()
      toast.success("PDF badges exported successfully")
    } catch (err) {
      console.error(err)
      toast.error("Failed to export PDF")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Non-printable Control Panel */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/camp/members">
                <Button variant="ghost" size="sm" className="gap-1 px-2 text-xs">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Members
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl font-black text-foreground">
              Print & Export Camp Badges
            </h1>
            <p className="text-xs text-muted-foreground">
              Batch export or print standard 54mm × 85.6mm ID cards for MOR Camp 2026 delegates.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              className="gap-2 font-medium"
              onClick={handlePrint}
              disabled={filteredMembers.length === 0}
            >
              <Printer className="w-4 h-4" />
              Browser Print
            </Button>

            <Button
              className="bg-primary text-white hover:bg-primary/90 gap-2 font-semibold shadow-md"
              onClick={handleDownloadPDF}
              disabled={exporting || filteredMembers.length === 0}
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export All ({filteredMembers.length}) as PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 border shadow-sm flex flex-wrap gap-3 items-center">
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Groups</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Dynamic DB Branches Filter */}
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Branches</SelectItem>
              {dbBranches.map((b) => (
                <SelectItem key={b.id} value={b.name}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-xs text-muted-foreground ml-auto font-semibold">
            Showing {filteredMembers.length} badges
          </div>
        </Card>
      </div>

      {/* Printable Sheet */}
      <div ref={printAreaRef} className="print:m-0 print:p-0">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            Loading badges...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No attendees match the selected print filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-2 print:gap-4 print:p-2">
            {filteredMembers.map((member) => (
              <div key={member.id} className="flex flex-col items-center gap-1.5 break-inside-avoid">
                <MorTagFront member={member} width="54mm" height="85.6mm" compact={true} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
