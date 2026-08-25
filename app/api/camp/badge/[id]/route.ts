import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsPDF } from "jspdf"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

let cachedPhotoBase64: string | null = null

function getCampPhotoBase64(): string {
  if (cachedPhotoBase64) return cachedPhotoBase64
  try {
    const filePath = path.join(process.cwd(), "public", "camp_photo.jpeg")
    const buffer = fs.readFileSync(filePath)
    cachedPhotoBase64 = "data:image/jpeg;base64," + buffer.toString("base64")
    return cachedPhotoBase64
  } catch (err) {
    console.error("Failed to read public/camp_photo.jpeg:", err)
    return ""
  }
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params

    const member = await db.campMember.findFirst({
      where: {
        OR: [{ id }, { badgeId: id }],
      },
    })

    if (!member) {
      return new NextResponse("Attendee not found", { status: 404 })
    }

    const photoData = getCampPhotoBase64()

    const TAG_W = 54
    const TAG_H = 85.6

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [TAG_W, TAG_H],
      compress: true,
    })

    // ─────────────────────────────────────────────
    // SINGLE PAGE BADGE (FRONT)
    // ─────────────────────────────────────────────
    // Dark Background
    doc.setFillColor(11, 15, 25)
    doc.rect(0, 0, TAG_W, TAG_H, "F")

    // Top Camp Flyer Image (62% ≈ 53mm)
    if (photoData) {
      doc.addImage(photoData, "JPEG", 0, 0, TAG_W, 53, "", "FAST")
    }

    // Divider Line (Gold)
    doc.setDrawColor(251, 191, 36)
    doc.setLineWidth(0.6)
    doc.line(0, 53, TAG_W, 53)

    // Attendee Details
    const safeName = (member.fullName || "Attendee").toUpperCase()
    const branch = (member.branch || "—").toUpperCase()
    const group = (member.caregroup || "UNASSIGNED").toUpperCase()
    const room = (member.room || "").toUpperCase()
    const pos = (member.position || "").toUpperCase()
    const isLeader = pos.includes("LEADER")

    // Helper function for dotted field row
    const drawField = (
      label: string,
      val: string,
      y: number,
      valColor: [number, number, number]
    ) => {
      doc.setFont("Helvetica", "bold")
      doc.setFontSize(6.8)
      doc.setTextColor(156, 163, 175) // Gray
      doc.text(`${label} :`, 3.5, y)

      const labelWidth = label === "Name" ? 11 : label === "Branch" ? 13 : 12
      const startX = 3.5 + labelWidth
      const endX = TAG_W - 3.5

      // Dotted baseline
      doc.setDrawColor(255, 255, 255)
      doc.setLineDashPattern([0.5, 0.8], 0)
      doc.setLineWidth(0.3)
      doc.line(startX, y + 0.5, endX, y + 0.5)
      doc.setLineDashPattern([], 0) // reset dash

      // Value text
      doc.setTextColor(valColor[0], valColor[1], valColor[2])
      let fontSize = 7.5
      if (val.length > 25) fontSize = 5.5
      else if (val.length > 20) fontSize = 6.2
      else if (val.length > 15) fontSize = 7.0
      doc.setFontSize(fontSize)
      doc.text(val, startX + 0.5, y)
    }

    drawField("Name", safeName, 58.5, [255, 255, 255])
    drawField("Branch", branch, 64.0, [251, 191, 36]) // Gold
    drawField("Group", group, 69.5, [209, 213, 219]) // Light Gray

    // Leader Badge
    if (isLeader) {
      const leaderY = 75.5
      doc.setFillColor(250, 204, 21) // Amber
      doc.roundedRect(TAG_W / 2 - 11, leaderY, 22, 4.2, 2.1, 2.1, "F")
      doc.setFont("Helvetica", "bold")
      doc.setFontSize(6.5)
      doc.setTextColor(0, 0, 0)
      doc.text(pos, TAG_W / 2, leaderY + 3, { align: "center" })
    }

    // Card Outer Border (Blue #93C5FD)
    doc.setDrawColor(147, 197, 253)
    doc.setLineWidth(1)
    doc.rect(0.5, 0.5, TAG_W - 1, TAG_H - 1, "D")

    const pdfArrayBuffer = doc.output("arraybuffer")
    const filename = `${safeName.replace(/\s+/g, "_")}_MOR_Badge_${member.badgeId}.pdf`

    return new NextResponse(pdfArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error: any) {
    console.error("Failed to generate server badge PDF:", error)
    return new NextResponse("Failed to generate badge PDF: " + error?.message, {
      status: 500,
    })
  }
}
