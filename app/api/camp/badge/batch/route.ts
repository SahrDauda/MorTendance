import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsPDF } from "jspdf"
import path from "path"
import fs from "fs"

export const dynamic = "force-dynamic"

// Cache group background images in memory on server
const backgroundCache: Record<string, { data: string; alias: string }> = {}

function getCachedTagImage(
  caregroup?: string | null,
  position?: string | null
): { data: string; alias: string } | null {
  const pos = (position || "").trim().toUpperCase()
  const cg = (caregroup || "").trim().toUpperCase()

  let filename = "DIKAIOSIS.jpeg"
  if (
    pos.includes("SUPERVIS") ||
    pos.includes("HEAD SHEPHERD") ||
    cg.includes("SUPERVIS") ||
    !caregroup ||
    caregroup === "Unassigned"
  ) {
    filename = "SUPERVISOR.jpeg"
  } else if (cg.includes("DOX")) filename = "DOXASMOS.jpeg"
  else if (cg.includes("HAG")) filename = "HAGIASMOS.jpeg"
  else if (cg.includes("HUIO")) filename = "HUIOTHESIA.jpeg"
  else if (cg.includes("PAL")) filename = "PALINGENESIA.jpeg"
  else if (cg.includes("DIK")) filename = "DIKAIOSIS.jpeg"
  else filename = "SUPERVISOR.jpeg"

  if (!backgroundCache[filename]) {
    try {
      const filePath = path.join(process.cwd(), "public", "tags", filename)
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath)
        backgroundCache[filename] = {
          data: "data:image/jpeg;base64," + buffer.toString("base64"),
          alias: filename,
        }
      }
    } catch (e) {
      console.error(`Error reading ${filename}:`, e)
      return null
    }
  }

  return backgroundCache[filename] || null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ids, group, branch, role, gender } = body

    let members = []

    if (Array.isArray(ids) && ids.length > 0) {
      members = await db.campMember.findMany({
        where: { id: { in: ids } },
        orderBy: [{ caregroup: "asc" }, { fullName: "asc" }],
      })
    } else {
      // Dynamic query based on filters
      const where: any = {}
      if (group && group !== "ALL") {
        if (group === "UNASSIGNED") {
          where.OR = [{ caregroup: null }, { caregroup: "" }, { caregroup: "Unassigned" }]
        } else {
          where.caregroup = group
        }
      }
      if (branch && branch !== "ALL") {
        if (branch.toLowerCase() === "hq" || branch.toLowerCase() === "headquarters") {
          where.OR = [{ branch: "HQ" }, { branch: "Headquarters" }, { branch: null }]
        } else {
          where.branch = branch
        }
      }
      if (gender && gender !== "ALL") {
        where.gender = gender
      }
      if (role && role !== "ALL") {
        if (role === "LEADERS") {
          where.OR = [
            { position: { contains: "Leader", mode: "insensitive" } },
            { position: "Head Shepherd" },
          ]
        } else if (role === "MEMBERS") {
          where.AND = [
            { NOT: { position: { contains: "Leader", mode: "insensitive" } } },
            { NOT: { position: "Head Shepherd" } },
          ]
        } else if (role === "HEAD_SHEPHERD") {
          where.position = "Head Shepherd"
        }
      }

      members = await db.campMember.findMany({
        where,
        orderBy: [{ caregroup: "asc" }, { fullName: "asc" }],
      })
    }

    if (members.length === 0) {
      return NextResponse.json({ error: "No attendees found" }, { status: 404 })
    }

    const TAG_W = 54 // mm (standard badge width)
    const TAG_H = 76.12 // mm (scaled to exact master aspect ratio 4960x6992)

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [TAG_W, TAG_H],
      compress: true,
    })

    members.forEach((member: any, index: number) => {
      if (index > 0) {
        doc.addPage([TAG_W, TAG_H], "portrait")
      }

      const imgInfo = getCachedTagImage(member.caregroup, member.position)

      // 1. High-Res Group Background Image
      if (imgInfo) {
        doc.addImage(imgInfo.data, "JPEG", 0, 0, TAG_W, TAG_H, imgInfo.alias, "FAST")
      }

      // 2. Location Indicator directly above Group Name (Y: ~59.8%)
      const rawBranch = (member.branch || "HQ").trim()
      const displayBranch =
        rawBranch.toLowerCase() === "hq" || rawBranch.toLowerCase() === "headquarters"
          ? "HEADQUARTERS"
          : rawBranch.toUpperCase()
      const branchText = displayBranch

      doc.setFont("Helvetica", "bold")
      doc.setFontSize(5.0)
      const branchTextWidth = doc.getTextWidth(branchText)
      const branchPillW = branchTextWidth + 5.0
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
      const isSupervisor = pos.includes("SUPERVIS") || pos.includes("HEAD SHEPHERD")
      const isLeader =
        !isSupervisor &&
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

      // Dynamic Vector Name Text (guaranteed to never clip)
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
    })

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))
    const filename = `MOR_Camp_2026_Badges_${members.length}_Delegates.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error("Batch PDF generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate batch PDF", details: error.message },
      { status: 500 }
    )
  }
}
