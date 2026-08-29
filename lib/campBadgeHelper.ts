"use client"

import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { resolveGroupTagImage, isGeneralMember } from "@/components/camp/mor-tag-front"

// In-memory cache for base64 group tag images
const groupImageBase64Cache: Record<string, string> = {}

export async function getGroupTagBase64(caregroup?: string | null): Promise<string> {
  const relativePath = resolveGroupTagImage(caregroup)
  if (groupImageBase64Cache[relativePath]) {
    return groupImageBase64Cache[relativePath]
  }

  try {
    const res = await fetch(relativePath)
    const blob = await res.blob()
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    groupImageBase64Cache[relativePath] = base64
    return base64
  } catch (e) {
    console.warn(`Could not load ${relativePath} as base64, falling back to path`, e)
    return relativePath
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
 * Directly downloads a single-page high-res Front badge PDF for an attendee using their group's artwork.
 */
export async function downloadAttendeeBadge(attendee: BadgeAttendeeData): Promise<void> {
  const photoBase64 = await getGroupTagBase64(attendee.caregroup)

  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.top = "-99999px"
  container.style.left = "-99999px"
  container.style.width = "54mm"
  container.style.zIndex = "-9999"
  container.style.pointerEvents = "none"

  const safeName = (attendee.fullName || "Attendee").trim().toUpperCase()
  const isLeader = !isGeneralMember(attendee.position)
  const isEmmanuel = safeName.includes("EMMANUEL") && safeName.includes("DAUDA")

  const getSvgTextParams = (name: string) => {
    const len = name.length
    if (len > 22) return { fontSize: "68", textLength: 'textLength="820" lengthAdjust="spacingAndGlyphs"', letterSpacing: "-1" }
    if (len > 18) return { fontSize: "76", textLength: 'textLength="820" lengthAdjust="spacingAndGlyphs"', letterSpacing: "-0.5" }
    if (len > 14) return { fontSize: "84", textLength: 'textLength="820" lengthAdjust="spacingAndGlyphs"', letterSpacing: "0" }
    if (len > 10) return { fontSize: "92", textLength: 'textLength="820" lengthAdjust="spacingAndGlyphs"', letterSpacing: "0.5" }
    if (len > 7) return { fontSize: "98", textLength: 'textLength="800" lengthAdjust="spacingAndGlyphs"', letterSpacing: "1" }
    return { fontSize: "106", textLength: "", letterSpacing: "1.5" }
  }

  const textParams = getSvgTextParams(safeName)

  container.innerHTML = `
    <div id="mor-pdf-front" style="
      width: 54mm;
      height: 76.12mm;
      position: relative;
      overflow: hidden;
      background: #0b0f19;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      font-family: Arial, Helvetica, sans-serif;
    ">
      <!-- Full Graphic Background -->
      <img src="${photoBase64}" style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        display: block;
      " />

      <!-- Branch Indicator directly above Group Name (Y: ~59.8%) -->
      <div style="
        position: absolute;
        top: 59.8%;
        left: 50%;
        transform: translateX(-50%);
        z-index: 4;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
          color: #ffffff;
          font-weight: 800;
          font-family: 'Barlow Condensed', 'Arial Black', 'Impact', Arial, sans-serif;
          font-size: 1.6mm;
          padding: 0.3mm 2mm;
          border-radius: 999px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          white-space: nowrap;
        ">
          BRANCH: ${(attendee.branch || "HQ").toLowerCase() === "headquarters" ? "HQ" : (attendee.branch || "HQ").toUpperCase()}
        </div>
      </div>

      <!-- White Name Replacement Box (Overlays sample text in graphic: Y 80.09%-90.37%, X 5.08%-94.90%) -->
      <div style="
        position: absolute;
        top: 80.09%;
        left: 5.08%;
        width: 89.84%;
        height: 10.28%;
        background: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px 8px;
        box-sizing: border-box;
        overflow: hidden;
        z-index: 5;
      ">
        <svg
          viewBox="0 0 1000 160"
          style="width: 100%; height: 100%; display: block; overflow: hidden;"
          preserveAspectRatio="xMidYMid meet"
        >
          <text
            x="500"
            y="90"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="#0f172a"
            style="font-family: 'Barlow Condensed', 'Arial Black', 'Impact', 'Trebuchet MS', Arial, sans-serif; font-weight: 900; text-transform: uppercase;"
            font-size="${textParams.fontSize}"
            letter-spacing="${textParams.letterSpacing}"
            ${textParams.textLength}
          >
            ${safeName}
          </text>
        </svg>
      </div>

      <!-- Leader Ribbon Overlay -->
      ${
        isLeader
          ? `
      <div style="
        position: absolute;
        top: 91.2%;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10;
        width: 90%;
      ">
        <div style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #facc15;
          color: #000000;
          font-weight: 900;
          font-family: 'Barlow Condensed', Arial, sans-serif;
          font-size: 1.8mm;
          padding: 0.4mm 2.2mm;
          border-radius: 999px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          white-space: nowrap;
        ">
          ★ LEADER${isEmmanuel ? " • COMMITTED CHRISTIAN" : ""} ★
        </div>
      </div>
      `
          : ""
      }
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
    const TAG_H_MM = 76.12

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [TAG_W_MM, TAG_H_MM],
      compress: true,
    })

    pdf.addImage(
      canvasFront.toDataURL("image/jpeg", 0.98),
      "JPEG",
      0,
      0,
      TAG_W_MM,
      TAG_H_MM,
      "",
      "FAST"
    )

    const filename = `${safeName.replace(/\s+/g, "_")}_MOR_Badge_${attendee.badgeId}.pdf`
    pdf.save(filename)
  } finally {
    document.body.removeChild(container)
  }
}
