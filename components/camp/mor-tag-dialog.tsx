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
import { downloadAttendeeBadge } from "@/lib/campBadgeHelper"
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
  const isSupervisor =
    member.position?.toLowerCase().includes("supervisor") ||
    member.position === "Head Shepherd"
  const isEmmanuel =
    member.fullName?.trim().toLowerCase().includes("emmanuel") &&
    member.fullName?.trim().toLowerCase().includes("dauda")

  const handleDownloadFormat = async (format: "pdf" | "jpg" | "png") => {
    try {
      setDownloading(true)
      toast.info(`Preparing ${format.toUpperCase()} badge for ${member.fullName}...`)
      await downloadAttendeeBadge(
        {
          fullName: member.fullName,
          badgeId: member.badgeId,
          branch: member.branch,
          caregroup: member.caregroup,
          room: member.room,
          position: member.position,
        },
        format
      )
      toast.success(`Downloaded ${format.toUpperCase()} badge successfully`)
    } catch (e) {
      console.error(e)
      toast.error(`Failed to download ${format.toUpperCase()} badge`)
    } finally {
      setDownloading(false)
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
              {isSupervisor ? (
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] font-bold uppercase tracking-wider">
                  {member.position === "Head Shepherd" ? "Head Shepherd" : "Supervisor"}
                </Badge>
              ) : isLeader ? (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                  {isEmmanuel
                    ? "Leader • Committed Christian"
                    : member.position || "Leader"}
                </Badge>
              ) : (
                <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] font-bold uppercase tracking-wider">
                  Delegate Member
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
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Position</span>
            </div>
            <div className="text-sm font-bold text-slate-100 truncate">
              {member.position || "Member"}
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
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Download Badge</span>
              <span className="text-[10px] text-teal-400 font-mono font-bold">600 DPI VECTOR READY</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold h-11 text-xs shadow-md shadow-teal-500/20 rounded-xl gap-1.5 transition-all active:scale-[0.98]"
                onClick={() => handleDownloadFormat("pdf")}
                disabled={downloading}
              >
                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                PDF
              </Button>

              <Button
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold h-11 text-xs shadow-md shadow-sky-500/20 rounded-xl gap-1.5 transition-all active:scale-[0.98]"
                onClick={() => handleDownloadFormat("png")}
                disabled={downloading}
              >
                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                PNG
              </Button>

              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold h-11 text-xs shadow-md shadow-amber-500/20 rounded-xl gap-1.5 transition-all active:scale-[0.98]"
                onClick={() => handleDownloadFormat("jpg")}
                disabled={downloading}
              >
                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                JPG
              </Button>
            </div>
          </div>

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
