"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  Edit2,
  Trash2,
  Phone,
  Building,
  User,
  ShieldCheck,
  Utensils,
  Sparkles,
  Loader2,
} from "lucide-react"
import { CampMemberTagInfo } from "./mor-tag-front"
import MorTagFront from "./mor-tag-front"
import { toast } from "sonner"

export interface FullCampMemberInfo extends CampMemberTagInfo {
  id?: string
  badgeId: string
  gender?: string
  phone?: string | null
  paid?: boolean
  paidAmount?: number | null
  paymentClaimed?: boolean
  couponNum?: number
  foodReceived?: boolean
  createdAt?: string
}

interface MorTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: FullCampMemberInfo | null
  onEdit?: (member: any) => void
  onDelete?: (member: any) => void
}

export function MorTagDialog({
  open,
  onOpenChange,
  member,
  onEdit,
  onDelete,
}: MorTagDialogProps) {
  const [downloading, setDownloading] = useState(false)

  if (!member) return null

  const isLeader =
    member.position?.toLowerCase().includes("leader") ||
    member.position === "Head Shepherd"
  const isEmmanuel =
    member.fullName?.trim().toLowerCase().includes("emmanuel") &&
    member.fullName?.trim().toLowerCase().includes("dauda")

  const handleDownload = async () => {
    try {
      setDownloading(true)
      toast.success(`Preparing badge for ${member.fullName}...`)
      const target = member.id || member.badgeId
      const downloadUrl = `/api/camp/badge/${target}`

      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `${(member.fullName || "Attendee").replace(/\s+/g, "_")}_MOR_Badge_${member.badgeId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      toast.error("Failed to download badge")
    } finally {
      setTimeout(() => setDownloading(false), 800)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] bg-slate-950/95 backdrop-blur-xl text-white border-slate-800/80 p-6 overflow-y-auto max-h-[92vh] shadow-2xl rounded-3xl">
        {/* Top Header */}
        <div className="space-y-2 pb-3 border-b border-slate-800/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-primary/20 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider">
                {member.badgeId}
              </span>
              {isLeader && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-black uppercase tracking-wider gap-1 py-0.5">
                  <Sparkles className="w-3 h-3" />
                  {isEmmanuel
                    ? "Leader • Committed Christian"
                    : member.position || "Leader"}
                </Badge>
              )}
            </div>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            {member.fullName}
          </DialogTitle>
          <p className="text-slate-400 text-xs flex items-center gap-1.5">
            <span>MOR Camp 2026</span>
            <span>•</span>
            <span className="text-slate-300 font-medium">
              {member.caregroup || "Unassigned Group"}
            </span>
          </p>
        </div>

        {/* Visual Tag Preview Card */}
        <div className="flex justify-center py-2">
          <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 p-0.5 bg-gradient-to-b from-white/10 to-transparent">
            <MorTagFront member={member} width={230} height={324} />
          </div>
        </div>

        {/* Organized Info Tiles Grid */}
        <div className="grid grid-cols-2 gap-2.5 py-2">
          {/* Branch Card */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
              <Building className="w-3.5 h-3.5 text-sky-400" />
              <span>Sending Branch</span>
            </div>
            <div className="text-sm font-bold text-slate-100 truncate">
              {(member.branch || "HQ").toLowerCase() === "headquarters"
                ? "HQ"
                : member.branch || "HQ"}
            </div>
          </div>

          {/* Group Card */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Camp Group</span>
            </div>
            <div className="text-sm font-bold text-purple-300 truncate">
              {member.caregroup || "Unassigned"}
            </div>
          </div>

          {/* Gender Card */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gender</span>
            </div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  member.gender === "Female" ? "bg-pink-400" : "bg-sky-400"
                }`}
              />
              {member.gender || "Male"}
            </div>
          </div>

          {/* Phone Card */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Contact Phone</span>
            </div>
            <div className="text-sm font-bold text-slate-100 truncate font-mono">
              {member.phone || "—"}
            </div>
          </div>

          {/* Position Card */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Role / Position</span>
            </div>
            <div className="text-sm font-bold text-slate-100 truncate">
              {member.position || "General Member"}
            </div>
          </div>

          {/* Food Check-in Card */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
              <Utensils className="w-3.5 h-3.5 text-rose-400" />
              <span>Food Check-in</span>
            </div>
            <div className="text-sm font-bold">
              {member.foodReceived ? (
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Served
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3 pt-3 border-t border-slate-800/80">
          <Button
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black h-12 text-sm shadow-lg shadow-teal-500/20 tracking-wide rounded-xl gap-2 transition-all active:scale-[0.99]"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating Badge...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Download Official Tag (PDF)
              </>
            )}
          </Button>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700/80 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5 rounded-xl text-xs font-semibold px-3"
                  onClick={() => {
                    onOpenChange(false)
                    onEdit(member)
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5 text-sky-400" /> Edit Profile
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 gap-1.5 rounded-xl text-xs font-semibold px-3"
                  onClick={() => {
                    onOpenChange(false)
                    onDelete(member)
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white rounded-xl text-xs font-medium"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

