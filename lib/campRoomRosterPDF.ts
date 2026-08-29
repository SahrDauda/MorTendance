"use client"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export interface RosterOccupant {
  id: string
  badgeId: string
  fullName: string
  gender: string
  phone?: string | null
  branch?: string | null
  caregroup?: string | null
  position?: string | null
}

export interface RosterRoom {
  id: string
  name: string
  gender: string
  leader?: string | null
  assistant?: string | null
  notes?: string | null
  occupants: RosterOccupant[]
}

/**
 * Generates a clean, professional A4 Room Roster PDF for a single room.
 */
export function downloadSingleRoomRosterPDF(room: RosterRoom): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  renderRoomRosterPage(doc, room, 1, 1)

  const safeName = room.name.replace(/\s+/g, "_")
  doc.save(`MOR_Camp_2026_${safeName}_Room_Roster.pdf`)
}

/**
 * Generates a master PDF with all room rosters (1 room per page).
 */
export function downloadAllRoomsRosterPDF(rooms: RosterRoom[]): void {
  if (!rooms || rooms.length === 0) return

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  rooms.forEach((room, index) => {
    if (index > 0) {
      doc.addPage("a4", "portrait")
    }
    renderRoomRosterPage(doc, room, index + 1, rooms.length)
  })

  doc.save(`MOR_Camp_2026_All_Rooms_Roster_Master.pdf`)
}

function renderRoomRosterPage(
  doc: jsPDF,
  room: RosterRoom,
  pageIndex: number,
  totalPages: number
) {
  const PAGE_W = 210
  const MARGIN = 14

  // Top Navy Header Bar
  doc.setFillColor(15, 23, 42) // Slate 900
  doc.rect(0, 0, PAGE_W, 28, "F")

  // Accent Gold Line
  doc.setFillColor(251, 191, 36) // Gold
  doc.rect(0, 28, PAGE_W, 1.5, "F")

  // Title text
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text("MOR CAMP 2026 — OFFICIAL ROOM ROSTER", MARGIN, 13)

  doc.setFont("Helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(203, 213, 225) // Slate 300
  doc.text(
    `Mount of Restoration Camp Meeting • Generated: ${new Date().toLocaleDateString()}`,
    MARGIN,
    21
  )

  // Room Overview Box
  doc.setFillColor(248, 250, 252) // Slate 50
  doc.setDrawColor(226, 232, 240) // Slate 200
  doc.setLineWidth(0.4)
  doc.roundedRect(MARGIN, 33, PAGE_W - MARGIN * 2, 24, 2, 2, "FD")

  // Room Name & Gender Badge
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text(`ROOM: ${room.name.toUpperCase()}`, MARGIN + 4, 42)

  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Gender: ${room.gender} Lodging  •  Total Delegates: ${room.occupants.length}`, MARGIN + 4, 48)

  // Leadership Info (Head & Assistant)
  doc.setFontSize(8.5)
  const headText = room.leader ? room.leader : "Not Assigned"
  const asstText = room.assistant ? room.assistant : "Not Assigned"

  doc.setFont("Helvetica", "bold")
  doc.setTextColor(180, 83, 9) // Amber 700
  doc.text(`Head of Room: `, MARGIN + 105, 42)
  doc.setFont("Helvetica", "normal")
  doc.setTextColor(15, 23, 42)
  doc.text(headText, MARGIN + 130, 42)

  doc.setFont("Helvetica", "bold")
  doc.setTextColor(14, 116, 144) // Cyan 700
  doc.text(`Assistant Head: `, MARGIN + 105, 48)
  doc.setFont("Helvetica", "normal")
  doc.setTextColor(15, 23, 42)
  doc.text(asstText, MARGIN + 130, 48)

  // Table of Occupants
  const tableData =
    room.occupants.length > 0
      ? room.occupants.map((occ, idx) => [
          (idx + 1).toString(),
          occ.badgeId || "—",
          occ.fullName.toUpperCase(),
          occ.branch || "—",
          occ.caregroup || "—",
          occ.phone ? `+232 ${occ.phone.replace(/^(\+232|0)/, "")}` : "—",
          occ.position === "Leader" ? "LEADER" : "MEMBER",
          "", // Checkbox / Signature blank
        ])
      : [["—", "—", "No delegates assigned to this room yet.", "—", "—", "—", "—", ""]]

  autoTable(doc, {
    startY: 61,
    margin: { left: MARGIN, right: MARGIN, bottom: 18 },
    head: [
      [
        "#",
        "Badge ID",
        "Full Name",
        "Sending Branch",
        "Camp Group",
        "Phone / WhatsApp",
        "Role",
        "Check-In / Sig.",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
      halign: "left",
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 22, fontStyle: "bold" },
      2: { cellWidth: 48, fontStyle: "bold" },
      3: { cellWidth: 28 },
      4: { cellWidth: 26 },
      5: { cellWidth: 26 },
      6: { cellWidth: 16, halign: "center" },
      7: { cellWidth: 18, halign: "center" },
    },
  })

  // Footer
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(
    `Room Roster • ${room.name} (${room.gender}) • Page ${pageIndex} of ${totalPages}`,
    MARGIN,
    290
  )
  doc.text("Mount of Restoration © 2026", PAGE_W - MARGIN - 38, 290)
}
