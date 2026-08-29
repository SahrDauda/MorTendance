import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsPDF } from "jspdf"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

const groupImageBase64Cache: Record<string, string> = {}

function resolveGroupFilename(caregroup?: string | null): string {
  const norm = (caregroup || "").trim().toUpperCase()
  if (norm.includes("DIKAIOSIS") || norm.includes("DIK")) return "DIKAIOSIS.jpeg"
  if (norm.includes("DOXASMOS") || norm.includes("DOX")) return "DOXASMOS.jpeg"
  if (norm.includes("HAGIASMOS") || norm.includes("HAG")) return "HAGIASMOS.jpeg"
  if (norm.includes("HUIOTHESIA") || norm.includes("HUIO")) return "HUIOTHESIA.jpeg"
  if (norm.includes("PALINGENESIA") || norm.includes("PALIGENESIA") || norm.includes("PAL"))
    return "PALINGENESIA.jpeg"
  return "DIKAIOSIS.jpeg"
}

function getGroupPhotoBase64(caregroup?: string | null): string {
  const filename = resolveGroupFilename(caregroup)
  if (groupImageBase64Cache[filename]) return groupImageBase64Cache[filename]

  try {
    const filePath = path.join(process.cwd(), "public", "tags", filename)
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath)
      const base64 = "data:image/jpeg;base64," + buffer.toString("base64")
      groupImageBase64Cache[filename] = base64
      return base64
    }
    return ""
  } catch (err) {
    console.error(`Failed to read public/tags/${filename}:`, err)
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

    const photoData = getGroupPhotoBase64(member.caregroup)

    // Aspect ratio: 4960 / 6992 = ~0.70938
    const TAG_W = 54
    const TAG_H = 76.12

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [TAG_W, TAG_H],
      compress: true,
    })

    // 1. High-Res Group Background Image
    if (photoData) {
      doc.addImage(photoData, "JPEG", 0, 0, TAG_W, TAG_H, "", "FAST")
    }

    // 2. Branch Indicator directly above Group Name (Y: ~59.8%)
    const rawBranch = (member.branch || "HQ").trim()
    const displayBranch =
      rawBranch.toLowerCase() === "headquarters" ? "HQ" : rawBranch.toUpperCase()
    const branchText = `BRANCH: ${displayBranch}`

    doc.setFont("Helvetica", "bold")
    doc.setFontSize(5.2)
    const branchTextWidth = doc.getTextWidth(branchText)
    const branchPillW = branchTextWidth + 5.5
    const branchPillH = 3.0
    const branchY = TAG_H * 0.598

    doc.setFillColor(15, 23, 42) // Dark Slate #0F172A
    doc.roundedRect(
      TAG_W / 2 - branchPillW / 2,
      branchY,
      branchPillW,
      branchPillH,
      1.5,
      1.5,
      "F"
    )
    doc.setTextColor(255, 255, 255)
    doc.text(branchText, TAG_W / 2, branchY + branchPillH / 2, {
      align: "center",
      baseline: "middle",
    })

    const safeName = (member.fullName || "Attendee").trim().toUpperCase()
    const pos = (member.position || "").trim().toUpperCase()
    const isLeader =
      pos.includes("LEADER") &&
      !pos.includes("GENERAL") &&
      pos !== "MEMBER" &&
      pos !== "ATTENDEE"
    const isEmmanuel = safeName.includes("EMMANUEL") && safeName.includes("DAUDA")

    // 3. White Name Replacement Box (Overlays sample name in graphic: Y 80.09%-90.37%, X 5.08%-94.90%)
    const boxX = TAG_W * 0.0508 // 2.74mm
    const boxY = TAG_H * 0.8009 // 60.97mm
    const boxW = TAG_W * 0.8984 // 48.51mm
    const boxH = TAG_H * 0.1028 // 7.83mm

    doc.setFillColor(255, 255, 255)
    doc.rect(boxX, boxY, boxW, boxH, "F")

    // 3. Dynamic Vector Name Text (guaranteed to never clip)
    const maxTextWidth = boxW - 8 // 40.5mm safe printable width (4mm padding on each side)
    let fontSize = 12.0
    doc.setFont("Helvetica", "bold")
    doc.setFontSize(fontSize)
    while (doc.getTextWidth(safeName) > maxTextWidth && fontSize > 4.5) {
      fontSize -= 0.3
      doc.setFontSize(fontSize)
    }

    doc.setTextColor(15, 23, 42) // Dark Slate #0F172A
    doc.text(safeName, TAG_W / 2, boxY + boxH / 2, {
      align: "center",
      baseline: "middle",
    })

    // 4. Leader Ribbon Overlay
    if (isLeader) {
      const leaderText = isEmmanuel ? "LEADER • COMMITTED CHRISTIAN" : "LEADER"
      doc.setFont("Helvetica", "bold")
      const leaderFontSize = isEmmanuel ? 4.6 : 5.8
      doc.setFontSize(leaderFontSize)

      const textWidth = doc.getTextWidth(leaderText)
      const pillW = Math.min(TAG_W * 0.88, textWidth + 6)
      const pillH = 3.6
      const leaderY = TAG_H * 0.918

      doc.setFillColor(250, 204, 21) // Amber Gold #FACC15
      doc.roundedRect(TAG_W / 2 - pillW / 2, leaderY, pillW, pillH, 1.8, 1.8, "F")

      doc.setTextColor(0, 0, 0)
      doc.text(leaderText, TAG_W / 2, leaderY + pillH / 2, {
        align: "center",
        baseline: "middle",
      })
    }

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
