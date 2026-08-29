"use client"

import type { ParsedAttendeeRow } from "@/components/camp/camp-bulk-import-dialog"

/**
 * Dynamically loads PDF.js from CDN to avoid Turbopack & SSR bundling conflicts.
 */
async function getPdfJsLib(): Promise<any> {
  if (typeof window === "undefined") return null
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="pdf.min.js"]')
    if (existing) {
      const interval = setInterval(() => {
        if ((window as any).pdfjsLib) {
          clearInterval(interval)
          resolve((window as any).pdfjsLib)
        }
      }, 50)
      setTimeout(() => {
        clearInterval(interval)
        if ((window as any).pdfjsLib) {
          resolve((window as any).pdfjsLib)
        } else {
          reject(new Error("Timeout loading PDF.js"))
        }
      }, 5000)
      return
    }

    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
    script.async = true
    script.onload = () => {
      const lib = (window as any).pdfjsLib
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
        resolve(lib)
      } else {
        reject(new Error("PDF.js library did not attach to window"))
      }
    }
    script.onerror = () => reject(new Error("Failed to load PDF.js script from CDN"))
    document.head.appendChild(script)
  })
}

const IGNORE_HEADER_WORDS = [
  "mor camp payments",
  "registration fee",
  "payment fee",
  "balance",
  "means of payment",
  "camp team",
  "category",
  "members without a camp team",
  "total leaders",
  "total members",
  "members list",
]

const CAMP_TEAM_MAP: { [key: string]: string } = {
  DOX: "Doxasmus",
  HUIO: "Huiothesia",
  DIK: "Dikaiosis",
  HAG: "Hagiasmos",
  PAL: "Paligenesia",
}

/**
 * Extracts and parses attendee rows from a PDF file.
 */
export async function parseAttendeesFromPDF(file: File): Promise<ParsedAttendeeRow[]> {
  const pdfjs = await getPdfJsLib()
  if (!pdfjs) {
    throw new Error("PDF parser could not be initialized in this browser environment.")
  }

  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) })
  const pdfDoc = await loadingTask.promise

  // 1. First pass: extract text from gender lists (Male / Female) if present
  let allPagesText = ""
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((i: any) => i.str).join(" ")
    allPagesText += " " + pageText
  }

  const maleNames = new Set<string>()
  const femaleNames = new Set<string>()

  // Find Male / Female list sections
  const maleListMatch = allPagesText.match(/Male\s*—\s*Full\s*List(.*?)(?:Female\s*—\s*Full\s*List|Camp\s*Team|$)/i)
  if (maleListMatch) {
    const maleText = maleListMatch[1]
    const matches = maleText.matchAll(/\b\d+\s+([A-Za-z\s\.\-\'\’]+?)\s+(?:Leader|Member|Non-Member)/g)
    for (const m of matches) {
      const n = m[1].trim().toLowerCase()
      if (n) maleNames.add(n)
    }
  }

  const femaleListMatch = allPagesText.match(/Female\s*—\s*Full\s*List(.*?)(?:Camp\s*Team|Members\s*Without|$)/i)
  if (femaleListMatch) {
    const femaleText = femaleListMatch[1]
    const matches = femaleText.matchAll(/\b\d+\s+([A-Za-z\s\.\-\'\’]+?)\s+(?:Leader|Member|Non-Member)/g)
    for (const m of matches) {
      const n = m[1].trim().toLowerCase()
      if (n) femaleNames.add(n)
    }
  }

  // 2. Extract Master list (Numbered entries 1 to N)
  // Clean header on page 1
  let masterText = allPagesText
  masterText = masterText.replace(/154Josephine/g, "154 Josephine")

  const pattern = /\b(\d+)\s+([A-Za-z0-9\s\.\-\'\’]+?)\s+(Leader|Member|Non-Member|Non-Membe)\s+([A-Za-z]+)\s+([0-9\.\-]+)\s+([0-9\.\-\ ]+)\s+([0-9\.\-\ ]+)\s*([\s\S]*?)(?=\b\d+\s+[A-Za-z]|$)/gi

  const matches = [...masterText.matchAll(pattern)]
  const results: ParsedAttendeeRow[] = []

  if (matches.length > 0) {
    for (const m of matches) {
      const nameRaw = m[2].trim().replace(/\s+/g, " ")
      if (nameRaw.length < 2 || /^(NO|NAME|PAYMENT|TOTAL)/i.test(nameRaw)) continue

      const category = m[3].toLowerCase().includes("leader") ? "Leader" : "Member"
      const groupRaw = m[4].trim()
      const rest = m[8] ? m[8].trim() : ""

      // Camp Team match (HUIO, DOX, PAL, HAG, DIK)
      const teamMatch = rest.match(/\b(HUIO|DOX|PAL|HAG|DIK)\b/i)
      let caregroup = ""
      if (teamMatch) {
        const teamCode = teamMatch[1].toUpperCase()
        caregroup = CAMP_TEAM_MAP[teamCode] || teamCode
      }

      // Branch logic: Headquarters, Eastern, Bo.
      let branch = "Headquarters"
      if (groupRaw.toLowerCase() === "eastern") {
        branch = "Eastern"
      } else if (groupRaw.toLowerCase() === "bo") {
        branch = "Bo"
      } else {
        branch = "Headquarters"
      }

      // Gender logic
      const nameLower = nameRaw.toLowerCase()
      let gender = "Male"
      if (femaleNames.has(nameLower)) {
        gender = "Female"
      } else if (maleNames.has(nameLower)) {
        gender = "Male"
      } else {
        gender =
          /\b(female|woman|sis|sister|mrs|miss|lady|mary|grace|fatmata|hannah|elizabeth|esther|christiana|princess|gladys|ernestine|uella|marina|betsy|sattu|rachel|janet|susana|susan|kadiatu|isata|josephine|ellen|tryphena|francess|umu|philicia|alextina|cecilia|ada|hassanatu|nadia|faith|alfreda|zoe|phebean|justina|favour|iris|hassania|mariam|emmanuella|rosaline|rosemary|victoria|findley|marvel|juliana|catherine|theodora|antoinette|mamie|portia|kumba|patricia|lovette|hawa|jessica|rebecca|florence|hawanatu|salome|marcnita|davida|jemimah|anita|lucy|matilda|khadijatu|chrispina|joanna|precious|ruth|sylvia|dennisha|clara|gloria|finda)\b/i.test(
            nameRaw
          )
            ? "Female"
            : "Male"
      }

      // Room logic (Commented out)
      const room = ""

      results.push({
        fullName: nameRaw,
        gender,
        phone: "",
        branch,
        caregroup, // empty if not in a camp team
        room, // Room commented out
        position: category,
        isValid: true,
      })
    }
  }

  return results
}
