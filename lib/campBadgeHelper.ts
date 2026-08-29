"use client"

import { resolveGroupTagImage, isGeneralMember } from "@/components/camp/mor-tag-front"
import JSZip from "jszip"

export interface BadgeAttendeeData {
  id?: string
  fullName: string
  badgeId: string
  branch?: string | null
  caregroup?: string | null
  room?: string | null
  position?: string | null
}

const imageElementCache: Record<string, HTMLImageElement> = {}

/**
 * Loads an image into an HTMLImageElement safely via Blob URL and caches it.
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageElementCache[src]) return imageElementCache[src]

  const res = await fetch(src)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imageElementCache[src] = img
      resolve(img)
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl)
      reject(err)
    }
    img.src = objectUrl
  })
}

/**
 * Draws the high-resolution badge to an HTML5 Canvas using pure 2D canvas methods.
 * Eliminates all external dependencies and CSS color parsing bugs (e.g. lab() / oklch()).
 */
async function renderBadgeToCanvas(attendee: BadgeAttendeeData): Promise<HTMLCanvasElement> {
  const relativePath = resolveGroupTagImage(attendee.caregroup, attendee.position)
  const bgImg = await loadImage(relativePath)

  // Standard high-res dimensions (scaled to 1275x1798px @ 600 DPI)
  const W = 1275
  const H = 1798

  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get 2D canvas context")

  // 1. Draw Background Artwork
  ctx.drawImage(bgImg, 0, 0, W, H)

  // 2. Draw Location Pill (HEADQUARTERS / EASTERN / BO)
  const rawBranch = (attendee.branch || "HQ").trim()
  const displayBranch =
    rawBranch.toLowerCase() === "hq" || rawBranch.toLowerCase() === "headquarters"
      ? "HEADQUARTERS"
      : rawBranch.toUpperCase()

  ctx.font = "bold 38px Arial, Helvetica, sans-serif"
  const branchTextWidth = ctx.measureText(displayBranch).width
  const pillW = branchTextWidth + 80
  const pillH = 65
  const branchY = H * 0.598

  // Draw Dark Slate Pill
  ctx.fillStyle = "#0F172A"
  ctx.beginPath()
  if (ctx.roundRect) {
    ctx.roundRect(W / 2 - pillW / 2, branchY, pillW, pillH, 32)
  } else {
    ctx.rect(W / 2 - pillW / 2, branchY, pillW, pillH)
  }
  ctx.fill()

  // Draw White Location Text
  ctx.fillStyle = "#FFFFFF"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(displayBranch, W / 2, branchY + pillH / 2)

  // 3. Draw White Name Box (Y: 80.09% - 90.37%, X: 5.08% - 94.90%)
  const boxX = W * 0.0508
  const boxY = H * 0.8009
  const boxW = W * 0.8984
  const boxH = H * 0.1028

  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(boxX, boxY, boxW, boxH)

  // 4. Auto-scaled Attendee Name
  const safeName = (attendee.fullName || "Attendee").trim().toUpperCase()
  const maxNameWidth = boxW - 80
  let fontSize = 95
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`
  while (ctx.measureText(safeName).width > maxNameWidth && fontSize > 36) {
    fontSize -= 3
    ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`
  }

  ctx.fillStyle = "#0F172A"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(safeName, W / 2, boxY + boxH / 2)

  // 5. Draw Leader Ribbon (if leader and not supervisor)
  const pos = (attendee.position || "").trim().toUpperCase()
  const isSupervisor = pos.includes("SUPERVIS") || pos.includes("HEAD SHEPHERD")
  const isLeader = !isGeneralMember(attendee.position) && !isSupervisor

  if (isLeader) {
    const isEmmanuel = safeName.includes("EMMANUEL") && safeName.includes("DAUDA")
    const leaderText = isEmmanuel ? "★ LEADER • COMMITTED CHRISTIAN ★" : "★ LEADER ★"
    const leaderFontSize = isEmmanuel ? 36 : 46
    ctx.font = `bold ${leaderFontSize}px Arial, Helvetica, sans-serif`
    const leaderTextWidth = ctx.measureText(leaderText).width
    const leaderPillW = Math.min(W * 0.88, leaderTextWidth + 80)
    const leaderPillH = 75
    const leaderY = H * 0.918

    // Amber Gold Pill
    ctx.fillStyle = "#FACC15"
    ctx.beginPath()
    if (ctx.roundRect) {
      ctx.roundRect(W / 2 - leaderPillW / 2, leaderY, leaderPillW, leaderPillH, 37)
    } else {
      ctx.rect(W / 2 - leaderPillW / 2, leaderY, leaderPillW, leaderPillH)
    }
    ctx.fill()

    ctx.fillStyle = "#000000"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(leaderText, W / 2, leaderY + leaderPillH / 2)
  }

  return canvas
}

/**
 * Directly downloads a single high-res Front badge in PDF, JPG, or PNG format.
 */
export async function downloadAttendeeBadge(
  attendee: BadgeAttendeeData,
  format: "pdf" | "jpg" | "png" = "pdf"
): Promise<void> {
  const safeName = (attendee.fullName || "Attendee").trim().toUpperCase()
  const baseFilename = `${safeName.replace(/\s+/g, "_")}_MOR_Badge_${attendee.badgeId}`
  const targetId = attendee.id || attendee.badgeId

  // 1. PDF Download -> Uses ultra-fast server vector PDF stream
  if (format === "pdf") {
    const response = await fetch(`/api/camp/badge/${targetId}`)
    if (!response.ok) throw new Error("Failed to generate badge PDF")
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${baseFilename}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    return
  }

  // 2. PNG / JPG Download -> Pure Canvas 2D DataURL download
  const canvas = await renderBadgeToCanvas(attendee)
  const mimeType = format === "png" ? "image/png" : "image/jpeg"
  const quality = format === "png" ? undefined : 0.98

  const dataUrl = canvas.toDataURL(mimeType, quality)
  const a = document.createElement("a")
  a.href = dataUrl
  a.download = `${baseFilename}.${format}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * Native Print of Attendee Badge directly to the printer with zero color bugs.
 */
export async function printAttendeeBadge(attendee: BadgeAttendeeData): Promise<void> {
  const canvas = await renderBadgeToCanvas(attendee)
  const dataUrl = canvas.toDataURL("image/png")

  const printWindow = window.open("", "_blank", "width=800,height=1000")
  if (!printWindow) {
    // Fallback: direct PDF download
    await downloadAttendeeBadge(attendee, "pdf")
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Tag - ${attendee.fullName}</title>
        <style>
          @page {
            size: 54mm 76.12mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            height: 100vh;
          }
          img {
            width: 54mm;
            height: 76.12mm;
            display: block;
            object-fit: cover;
          }
          @media print {
            body {
              height: auto;
            }
          }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" onload="window.focus(); window.print();" />
      </body>
    </html>
  `)
  printWindow.document.close()
}

/**
 * Generates and downloads a ZIP archive containing PNG or JPG badges for all attendees.
 */
export async function downloadAllBadgesZip(
  members: BadgeAttendeeData[],
  format: "png" | "jpg" = "png",
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (members.length === 0) return

  const zip = new JSZip()
  const folder = zip.folder(`MOR_Badges_${format.toUpperCase()}`) || zip
  const mimeType = format === "png" ? "image/png" : "image/jpeg"
  const quality = format === "png" ? undefined : 0.98

  for (let i = 0; i < members.length; i++) {
    const member = members[i]
    if (onProgress) onProgress(i + 1, members.length)

    try {
      const canvas = await renderBadgeToCanvas(member)
      const dataUrl = canvas.toDataURL(mimeType, quality)
      const base64Data = dataUrl.split(",")[1]

      if (base64Data) {
        const safeName = (member.fullName || "Attendee").trim().replace(/\s+/g, "_")
        const indexStr = String(i + 1).padStart(3, "0")
        const filename = `${indexStr}_${safeName}_${member.badgeId}.${format}`
        folder.file(filename, base64Data, { base64: true })
      }
    } catch (err) {
      console.warn(`Failed to render badge for ${member.fullName}:`, err)
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" })
  const url = window.URL.createObjectURL(zipBlob)
  const a = document.createElement("a")
  a.href = url
  a.download = `MOR_Camp_2026_Badges_${format.toUpperCase()}_${members.length}_Attendees.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
