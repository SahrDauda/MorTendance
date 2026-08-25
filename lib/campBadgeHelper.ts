"use client"

import jsPDF from "jspdf"
import html2canvas from "html2canvas"

// In-memory cache for base64 image
let cachedCampPhotoBase64: string | null = null

export async function getCampPhotoBase64(): Promise<string> {
  if (cachedCampPhotoBase64) return cachedCampPhotoBase64

  try {
    const res = await fetch("/camp_photo.jpeg")
    const blob = await res.blob()
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    cachedCampPhotoBase64 = base64
    return base64
  } catch (e) {
    console.warn("Could not load /camp_photo.jpeg as base64, falling back to path", e)
    return "/camp_photo.jpeg"
  }
}

export interface BadgeAttendeeData {
  fullName: string
  badgeId: string
  branch?: string | null
  caregroup?: string | null
  room?: string | null
  position?: string | null
}

/**
 * Directly downloads a single-page 54×85.6mm Front badge PDF for an attendee.
 */
export async function downloadAttendeeBadge(attendee: BadgeAttendeeData): Promise<void> {
  const photoBase64 = await getCampPhotoBase64()

  // Create isolated container in DOM
  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.top = "-99999px"
  container.style.left = "-99999px"
  container.style.width = "54mm"
  container.style.zIndex = "-9999"
  container.style.pointerEvents = "none"

  const safeName = (attendee.fullName || "Attendee").toUpperCase()
  const branch = (attendee.branch || "—").toUpperCase()
  const group = (attendee.caregroup || "UNASSIGNED").toUpperCase()
  const room = (attendee.room || "").toUpperCase()
  const pos = (attendee.position || "").toUpperCase()
  const isLeader = pos.includes("LEADER")

  const getFontSize = (str: string) => {
    if (str.length > 25) return "7.5pt"
    if (str.length > 20) return "8.5pt"
    if (str.length > 15) return "9.5pt"
    return "10.5pt"
  }

  container.innerHTML = `
    <!-- FRONT (Single Page) -->
    <div id="mor-pdf-front" style="
      width: 54mm;
      height: 85.6mm;
      position: relative;
      overflow: hidden;
      background: #0b0f19;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      border: 1mm solid #93C5FD;
      font-family: Arial, Helvetica, sans-serif;
    ">
      <!-- Art -->
      <div style="height: 62%; width: 100%; overflow: hidden; position: relative; flex-shrink: 0;">
        <img src="${photoBase64}" style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;" />
      </div>

      <!-- Divider -->
      <div style="height: 0.6mm; width: 100%; background: linear-gradient(90deg, #38bdf8, #fbbf24); flex-shrink: 0;"></div>

      <!-- Details -->
      <div style="
        height: 38%;
        width: 100%;
        position: relative;
        display: flex;
        flex-direction: column;
        justifyContent: center;
        padding: 2mm 2.5mm;
        box-sizing: border-box;
      ">
        <!-- Name -->
        <div style="display: flex; align-items: flex-end; width: 100%; margin-bottom: 1.2mm;">
          <span style="font-weight: 700; color: #9ca3af; font-size: 2.2mm; width: 9mm; flex-shrink: 0;">Name :</span>
          <div style="flex: 1; border-bottom: 1.5px dotted rgba(255,255,255,0.4); margin-left: 2px; padding-bottom: 1px;">
            <span style="font-weight: 800; color: #ffffff; font-size: ${getFontSize(safeName)}; white-space: nowrap;">${safeName}</span>
          </div>
        </div>

        <!-- Branch -->
        <div style="display: flex; align-items: flex-end; width: 100%; margin-bottom: 1.2mm;">
          <span style="font-weight: 700; color: #9ca3af; font-size: 2.2mm; width: 12mm; flex-shrink: 0;">Branch :</span>
          <div style="flex: 1; border-bottom: 1.5px dotted rgba(255,255,255,0.4); margin-left: 2px; padding-bottom: 1px;">
            <span style="font-weight: 800; color: #fbbf24; font-size: ${getFontSize(branch)}; white-space: nowrap;">${branch}</span>
          </div>
        </div>

        <!-- Group -->
        <div style="display: flex; align-items: flex-end; width: 100%; margin-bottom: 1.2mm;">
          <span style="font-weight: 700; color: #9ca3af; font-size: 2.2mm; width: 11mm; flex-shrink: 0;">Group :</span>
          <div style="flex: 1; border-bottom: 1.5px dotted rgba(255,255,255,0.4); margin-left: 2px; padding-bottom: 1px;">
            <span style="font-weight: 800; color: #d1d5db; font-size: ${getFontSize(group)}; white-space: nowrap;">${group}</span>
          </div>
        </div>

        <!-- Room (Commented out) -->
        <!--
        ${room ? `
        <div style="display: flex; align-items: flex-end; width: 100%; margin-bottom: 1.2mm;">
          <span style="font-weight: 700; color: #9ca3af; font-size: 2.2mm; width: 11mm; flex-shrink: 0;">Room :</span>
          <div style="flex: 1; border-bottom: 1.5px dotted rgba(255,255,255,0.4); margin-left: 2px; padding-bottom: 1px;">
            <span style="font-weight: 800; color: #38bdf8; font-size: ${getFontSize(room)}; white-space: nowrap;">${room}</span>
          </div>
        </div>
        ` : ""}
        -->

        <!-- Position Badge (if Leader) -->
        ${!isLeader ? "" : `
        <div style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #facc15;
          color: #000000;
          font-weight: 900;
          font-size: 2mm;
          padding: 0.6mm 2.5mm;
          border-radius: 999px;
          margin-top: 0.8mm;
          align-self: center;
          letter-spacing: 0.5px;
        ">
          ${pos}
        </div>
        `}
      </div>
    </div>
  `

  document.body.appendChild(container)

  try {
    await new Promise((r) => setTimeout(r, 150))
    const frontEl = container.querySelector("#mor-pdf-front") as HTMLElement

    const opts = {
      scale: 3.5,
      useCORS: true,
      allowTaint: false,
      logging: false,
    }

    const canvasFront = await html2canvas(frontEl, opts)

    const TAG_W_MM = 54
    const TAG_H_MM = 85.6

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [TAG_W_MM, TAG_H_MM],
      compress: true,
    })

    pdf.addImage(canvasFront.toDataURL("image/jpeg", 0.98), "JPEG", 0, 0, TAG_W_MM, TAG_H_MM, "", "FAST")

    const filename = `${safeName.replace(/\s+/g, "_")}_MOR_Badge_${attendee.badgeId}.pdf`
    pdf.save(filename)
  } finally {
    document.body.removeChild(container)
  }
}
