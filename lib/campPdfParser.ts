"use client"

import * as pdfjsLib from "pdfjs-dist"
import type { ParsedAttendeeRow } from "@/components/camp/camp-bulk-import-dialog"

// Set standard CDN worker for pdfjs in browser
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

const KNOWN_BRANCHES = [
  "Freetown Central",
  "Freetown",
  "Bo Branch",
  "Bo",
  "Kenema Branch",
  "Kenema",
  "Makeni Branch",
  "Makeni",
  "Kono Branch",
  "Kono",
  "Waterloo Branch",
  "Waterloo",
  "Lungi Branch",
  "Lungi",
  "Port Loko",
  "Kambia",
  "Goderich",
  "Lumley",
  "Kiss Town",
  "Congo Cross",
  "Wilberforce",
  "Aberdeen",
  "Brookfields",
  "Tower Hill",
  "Hastings",
  "Juba",
]

const IGNORE_HEADER_WORDS = [
  "attendance",
  "roster",
  "registration",
  "mor camp",
  "full name",
  "badge id",
  "phone number",
  "sending branch",
  "camp group",
  "check-in",
  "signature",
  "page ",
  "generated:",
  "room:",
  "head of room:",
  "assistant head:",
  "total delegates:",
  "ministry of reconciliation",
]

/**
 * Extracts and parses attendee rows from a PDF file.
 */
export async function parseAttendeesFromPDF(file: File): Promise<ParsedAttendeeRow[]> {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
  const pdfDoc = await loadingTask.promise

  const rawLines: string[] = []

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()

    // Group items by vertical Y-coordinate to reconstruct rows/lines
    const itemsByY: { [y: number]: { x: number; str: string }[] } = {}

    for (const item of textContent.items as any[]) {
      if (!item.str || !item.str.trim()) continue

      const y = Math.round(item.transform[5])
      const x = Math.round(item.transform[4])

      // Find an existing bucket within 3 pixels threshold
      let matchedY = Object.keys(itemsByY).find((existingY) => Math.abs(Number(existingY) - y) <= 3)

      if (!matchedY) {
        matchedY = String(y)
        itemsByY[Number(matchedY)] = []
      }

      itemsByY[Number(matchedY)].push({ x, str: item.str })
    }

    // Sort rows from top of page to bottom (descending Y)
    const sortedY = Object.keys(itemsByY)
      .map(Number)
      .sort((a, b) => b - a)

    for (const y of sortedY) {
      // Sort words from left to right (ascending X)
      const lineWords = itemsByY[y].sort((a, b) => a.x - b.x).map((i) => i.str.trim())
      const fullLine = lineWords.join(" ").trim()
      if (fullLine.length > 2) {
        rawLines.push(fullLine)
      }
    }
  }

  const results: ParsedAttendeeRow[] = []

  for (const line of rawLines) {
    const lower = line.toLowerCase()

    // Skip table headers and report headers
    if (IGNORE_HEADER_WORDS.some((hw) => lower.includes(hw))) {
      continue
    }

    // 1. Extract Phone Number
    let phone: string = ""
    const phoneMatch = line.match(/(?:\+?232|0)[0-9]{8,9}|[0-9]{8,9}/)
    if (phoneMatch) {
      phone = phoneMatch[0]
    }

    // 2. Extract Gender
    let gender = "Male"
    if (
      /\b(female|females|woman|women|sis|sister|mrs|miss|lady|madam)\b/i.test(line) ||
      /\bF\b/.test(line)
    ) {
      gender = "Female"
    } else if (
      /\b(male|males|man|men|bro|brother|mr|sir)\b/i.test(line) ||
      /\bM\b/.test(line)
    ) {
      gender = "Male"
    }

    // 3. Extract Role / Position
    let position = "Member"
    if (/\b(leader|pastor|minister|elder|coordinator|deacon|head|rev|reverend)\b/i.test(line)) {
      position = "Leader"
    }

    // 4. Extract Branch
    let branch = ""
    for (const kb of KNOWN_BRANCHES) {
      if (new RegExp(`\\b${kb}\\b`, "i").test(line)) {
        branch = kb
        break
      }
    }

    // 5. Extract Camp Group
    let caregroup = ""
    const groupMatch = line.match(/\b(Group\s*\d+|Elijah|Deborah|David|Esther|Daniel|Joshua|Gideon|Hannah)\b/i)
    if (groupMatch) {
      caregroup = groupMatch[0]
    }

    // 6. Clean Full Name from the text line
    let cleanName = line
      // Remove index numbers (e.g. "1.", "12)", "[1]")
      .replace(/^[\d#]+[.)\]\s-]*/, "")
      // Remove badge IDs (e.g. "MOR-012", "MOR-123")
      .replace(/\bMOR-\d+\b/gi, "")
      // Remove phone numbers
      .replace(/(?:\+?232|0)[0-9]{8,9}|[0-9]{8,9}/g, "")
      // Remove common separators
      .replace(/[|•,;:]/g, " ")

    // Remove known branch strings from name
    for (const kb of KNOWN_BRANCHES) {
      cleanName = cleanName.replace(new RegExp(`\\b${kb}\\b`, "gi"), "")
    }

    // Remove keywords like Male, Female, Leader, Member, Group
    cleanName = cleanName
      .replace(/\b(male|female|leader|member|pastor|minister|brother|sister|bro|sis|mr|mrs|miss)\b/gi, "")
      .replace(/\b(Group\s*\d+|Elijah|Deborah|David|Esther|Daniel|Joshua|Gideon|Hannah)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim()

    // Title case the name
    cleanName = cleanName
      .split(" ")
      .filter((w) => w.length > 0 && !/^[\d\W]+$/.test(w))
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")

    const isValid = cleanName.length >= 3 && cleanName.split(" ").length >= 1

    if (isValid) {
      results.push({
        fullName: cleanName,
        gender,
        phone: phone || "",
        branch: branch || "",
        caregroup: caregroup || "AUTO",
        room: "AUTO",
        position,
        isValid: true,
      })
    }
  }

  return results
}
