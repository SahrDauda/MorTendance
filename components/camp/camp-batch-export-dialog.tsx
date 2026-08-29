"use client"

import React, { useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Printer, Download, Loader2 } from "lucide-react"
import MorTagFront, { CampMemberTagInfo } from "./mor-tag-front"
import { downloadAttendeeBadge, downloadAllBadgesZip } from "@/lib/campBadgeHelper"
import { toast } from "sonner"

interface CampBatchExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: CampMemberTagInfo[]
  filterSummary?: {
    group: string
    branch: string
    role: string
    gender: string
    search?: string
  }
}

export function CampBatchExportDialog({
  open,
  onOpenChange,
  members,
  filterSummary,
}: CampBatchExportDialogProps) {
  const [exporting, setExporting] = useState(false)
  const printAreaRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadZip = async (format: "png" | "jpg") => {
    if (members.length === 0) return
    setExporting(true)
    const tId = toast.loading(`Generating ${format.toUpperCase()} images for ${members.length} badges...`)
    try {
      await downloadAllBadgesZip(members as any, format, (curr, total) => {
        if (curr % 25 === 0 || curr === total) {
          toast.loading(`Rendering ${format.toUpperCase()} badges: ${curr}/${total}...`, { id: tId })
        }
      })
      toast.success(`Downloaded all ${members.length} badges as ${format.toUpperCase()} ZIP`, { id: tId })
    } catch (err: any) {
      console.error("Batch ZIP error:", err)
      toast.error(`Failed to download ${format.toUpperCase()} ZIP: ${err?.message || "Error"}`, { id: tId })
    } finally {
      setExporting(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (members.length === 0) return
    setExporting(true)

    try {
      toast.info(`Preparing ${members.length} high-resolution vector badges...`)
      const ids = members.map((m) => m.id).filter(Boolean)

      const response = await fetch("/api/camp/badge/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })

      if (!response.ok) {
        throw new Error("Server failed to generate batch PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const groupTag =
        filterSummary?.group && filterSummary.group !== "ALL"
          ? `_${filterSummary.group}`
          : ""
      const roleTag =
        filterSummary?.role && filterSummary.role !== "ALL"
          ? `_${filterSummary.role}`
          : ""
      a.download = `MOR_Camp_2026_Badges${groupTag}${roleTag}_${members.length}_Delegates.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success(`Downloaded ${members.length} badges successfully`)
    } catch (err: any) {
      console.error("Batch download error:", err)
      toast.error("Failed to download batch PDF")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[96vw] bg-slate-950/98 backdrop-blur-2xl text-white border-slate-800/80 p-6 overflow-hidden max-h-[92vh] shadow-2xl rounded-3xl flex flex-col">
        {/* Modal Header */}
        <DialogHeader className="pb-3 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-primary/20 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider">
                {members.length} BADGES
              </span>
              <DialogTitle className="text-xl font-black text-white tracking-tight">
                Export & Print Badges
              </DialogTitle>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live preview of badges matching your current filters. Print directly or download as a high-resolution PDF.
            </p>

            {/* Active Filter Pills */}
            {filterSummary && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                {filterSummary.group !== "ALL" && (
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
                    Group: {filterSummary.group}
                  </Badge>
                )}
                {filterSummary.branch !== "ALL" && (
                  <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-[10px]">
                    Branch: {filterSummary.branch}
                  </Badge>
                )}
                {filterSummary.role !== "ALL" && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                    Role: {filterSummary.role}
                  </Badge>
                )}
                {filterSummary.gender !== "ALL" && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                    Gender: {filterSummary.gender}
                  </Badge>
                )}
                {filterSummary.search && (
                  <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
                    Search: &quot;{filterSummary.search}&quot;
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white gap-1.5 font-semibold text-xs rounded-xl h-10 px-3.5"
              onClick={handlePrint}
              disabled={members.length === 0 || exporting}
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              Browser Print
            </Button>

            <Button
              size="sm"
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-xs gap-1.5 rounded-xl h-10 px-3.5 shadow-md shadow-teal-500/20"
              onClick={handleDownloadPDF}
              disabled={exporting || members.length === 0}
            >
              {exporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              PDF (All)
            </Button>

            <Button
              size="sm"
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs gap-1.5 rounded-xl h-10 px-3.5 shadow-md shadow-sky-500/20"
              onClick={() => handleDownloadZip("png")}
              disabled={exporting || members.length === 0}
            >
              {exporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              PNG (ZIP)
            </Button>

            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs gap-1.5 rounded-xl h-10 px-3.5 shadow-md shadow-amber-500/20"
              onClick={() => handleDownloadZip("jpg")}
              disabled={exporting || members.length === 0}
            >
              {exporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              JPG (ZIP)
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Badge Grid Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/60 rounded-2xl border border-slate-800/40 my-2">
          {members.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              No attendees match the currently active filters.
            </div>
          ) : (
            <div
              ref={printAreaRef}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 justify-items-center print:grid-cols-2 print:gap-4 print:p-2"
            >
              {members.map((member) => (
                <div
                  key={member.id || member.badgeId}
                  className="flex flex-col items-center break-inside-avoid group/card space-y-1.5"
                >
                  <div className="rounded-xl overflow-hidden shadow-xl ring-1 ring-white/10 p-0.5 bg-gradient-to-b from-white/10 to-transparent">
                    <MorTagFront
                      member={member}
                      width="54mm"
                      height="76.12mm"
                      compact={true}
                    />
                  </div>
                  <div className="flex items-center gap-1 opacity-70 group-hover/card:opacity-100 transition-opacity print:hidden">
                    <button
                      onClick={() => downloadAttendeeBadge(member as any, "pdf")}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 hover:bg-teal-600 text-slate-300 hover:text-white transition-colors"
                      title="Download PDF"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => downloadAttendeeBadge(member as any, "png")}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white transition-colors"
                      title="Download PNG"
                    >
                      PNG
                    </button>
                    <button
                      onClick={() => downloadAttendeeBadge(member as any, "jpg")}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white transition-colors"
                      title="Download JPG"
                    >
                      JPG
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {members.length} delegates ready for print</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white text-xs"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
