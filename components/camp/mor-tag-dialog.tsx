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
  Loader2,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Phone,
  Building,
  BedDouble,
  User,
  ShieldCheck,
  Calendar,
} from "lucide-react"
import { CampMemberTagInfo } from "./mor-tag-front"
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

  const handleDownload = () => {
    toast.success(`Downloading badge for ${member.fullName}...`)
    const target = member.id || member.badgeId
    const downloadUrl = `/api/camp/badge/${target}`

    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = `${(member.fullName || "Attendee").replace(/\s+/g, "_")}_MOR_Badge_${member.badgeId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] bg-slate-950 text-white border-slate-800 p-6 overflow-y-auto max-h-[90vh] shadow-2xl rounded-2xl">

        {/* Header */}
        <div className="space-y-2 pb-4 border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-mono font-bold tracking-wider">
              {member.badgeId}
            </span>
            <Badge
              variant="outline"
              className={
                member.paid
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-semibold"
                  : "bg-red-500/20 text-red-400 border-red-500/40 font-semibold"
              }
            >
              {member.paid ? "Paid (NLe 300)" : "Unpaid"}
            </Badge>
            {member.position === "Leader" && (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 uppercase text-[10px] font-bold tracking-wider">
                Leader
              </Badge>
            )}
          </div>
          <DialogTitle className="text-2xl font-black text-white leading-tight tracking-tight">
            {member.fullName}
          </DialogTitle>
          <p className="text-slate-400 text-xs">Registered attendee • MOR Camp 2026</p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 py-4 text-xs">
          {[
            {
              icon: <User className="w-3.5 h-3.5" />,
              label: "Gender",
              value: member.gender === "Female" ? "🚺 Female" : "🚹 Male",
              color: "text-slate-200",
            },
            {
              icon: <Phone className="w-3.5 h-3.5" />,
              label: "Phone",
              value: member.phone || "—",
              color: "text-slate-200",
            },
            {
              icon: <Building className="w-3.5 h-3.5" />,
              label: "Sending Branch",
              value: member.branch || "—",
              color: "text-slate-200",
            },
            {
              icon: <ShieldCheck className="w-3.5 h-3.5" />,
              label: "Camp Group",
              value: member.caregroup || "Unassigned",
              color: "text-purple-300",
            },
            {
              icon: <BedDouble className="w-3.5 h-3.5" />,
              label: "Lodging Room",
              value: member.room || "Unassigned",
              color: "text-amber-300",
            },
            {
              icon: <User className="w-3.5 h-3.5" />,
              label: "Position",
              value: member.position || "Member",
              color: "text-slate-200",
            },
            {
              icon: <Calendar className="w-3.5 h-3.5" />,
              label: "Payment Status",
              value: member.paid ? "✅ Confirmed" : "⏳ Unpaid",
              color: member.paid ? "text-emerald-400" : "text-red-400",
            },
            {
              icon: <CheckCircle2 className="w-3.5 h-3.5" />,
              label: "Food Served",
              value: member.foodReceived ? "✅ Check-in Done" : "⏳ Pending",
              color: "text-slate-200",
            },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                {icon} {label}
              </span>
              <span className={`${color} font-bold text-sm block truncate`} title={value}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white gap-2 font-bold h-11 text-sm shadow-lg tracking-wide"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating Badge PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Download Tag
              </>
            )}
          </Button>

          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-1.5"
                  onClick={() => {
                    onOpenChange(false)
                    onEdit(member)
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 gap-1.5"
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
              className="text-slate-400 hover:text-white"
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
