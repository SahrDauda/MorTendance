"use client"

import React, { useEffect, useState } from "react"
import { BadgeAttendeeData } from "@/lib/campBadgeHelper"

interface MorBadgePrintButtonProps {
  member: BadgeAttendeeData
  autoPrint?: boolean
}

export default function MorBadgePrintButton({
  member,
  autoPrint = false,
}: MorBadgePrintButtonProps) {
  const [downloadDone, setDownloadDone] = useState(false)

  const handleDownload = () => {
    const target = member.badgeId
    const downloadUrl = `/api/camp/badge/${target}`

    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = `${(member.fullName || "Attendee").replace(/\s+/g, "_")}_MOR_Badge_${member.badgeId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setDownloadDone(true)
  }

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handleDownload()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [autoPrint])

  return (
    <button
      onClick={handleDownload}
      type="button"
      style={{
        padding: "10px 22px",
        background: downloadDone ? "#059669" : "#0d9488",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontWeight: 700,
        fontSize: "14px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 4px 14px rgba(13, 148, 136, 0.4)",
        transition: "all 0.2s ease",
      }}
    >
      {downloadDone ? "✅ Downloaded! Click to re-download" : "⬇️ Download Badge PDF"}
    </button>
  )
}
