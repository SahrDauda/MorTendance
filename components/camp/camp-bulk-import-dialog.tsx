"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileCheck2,
  Sparkles,
} from "lucide-react"
import * as XLSX from "xlsx"

export interface ParsedAttendeeRow {
  fullName: string
  gender: string
  phone: string
  branch: string
  caregroup: string
  room: string
  position: string
  isValid: boolean
  error?: string
}

interface CampBulkImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CampBulkImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: CampBulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedAttendeeRow[]>([])
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Full Name": "John Koroma",
        Gender: "Male",
        "Phone / WhatsApp": "077123456",
        Branch: "Freetown Central",
        "Camp Group": "Elijah Group",
        Room: "AUTO",
        Role: "Leader",
      },
      {
        "Full Name": "Fatmata Sesay",
        Gender: "Female",
        "Phone / WhatsApp": "076987654",
        Branch: "Bo Branch",
        "Camp Group": "Deborah Group",
        Room: "Bethany",
        Role: "Member",
      },
      {
        "Full Name": "David Mansaray",
        Gender: "Male",
        "Phone / WhatsApp": "078555123",
        Branch: "Kenema Branch",
        "Camp Group": "David Group",
        Room: "AUTO",
        Role: "Member",
      },
      {
        "Full Name": "Grace Kamara",
        Gender: "Female",
        "Phone / WhatsApp": "079111222",
        Branch: "Makeni Branch",
        "Camp Group": "Esther Group",
        Room: "AUTO",
        Role: "Member",
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendees")
    XLSX.writeFile(workbook, "MOR_Camp_2026_Attendees_Template.xlsx")
    toast.success("Excel template downloaded!")
  }

  // Parse Excel / CSV file
  const processFile = (uploadedFile: File) => {
    setFile(uploadedFile)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" })

        if (!rawJson || rawJson.length === 0) {
          toast.error("The uploaded file is empty.")
          setParsedRows([])
          return
        }

        const normalizedRows: ParsedAttendeeRow[] = rawJson.map((row) => {
          // Flexible key lookup
          const getVal = (keys: string[]) => {
            for (const key of Object.keys(row)) {
              const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "")
              for (const target of keys) {
                if (cleanKey.includes(target)) {
                  return String(row[key]).trim()
                }
              }
            }
            return ""
          }

          const fullName = getVal(["fullname", "name", "attendee"])
          const genderRaw = getVal(["gender", "sex"])
          const phone = getVal(["phone", "tel", "contact", "whatsapp", "mobile"])
          const branch = getVal(["branch", "church", "location"])
          const caregroup = getVal(["group", "caregroup", "team"])
          const room = getVal(["room", "hostel", "lodging"])
          const roleRaw = getVal(["role", "position", "leader"])

          const gender =
            genderRaw.toLowerCase().startsWith("f") || genderRaw.toLowerCase().includes("woman")
              ? "Female"
              : "Male"

          const position =
            roleRaw.toLowerCase().includes("leader") || roleRaw.toLowerCase().includes("head")
              ? "Leader"
              : "Member"

          const isValid = Boolean(fullName && fullName.length > 1)

          return {
            fullName,
            gender,
            phone,
            branch,
            caregroup,
            room: room || "AUTO",
            position,
            isValid,
            error: isValid ? undefined : "Full name is missing",
          }
        })

        setParsedRows(normalizedRows)
        const validCount = normalizedRows.filter((r) => r.isValid).length
        toast.success(`Parsed ${normalizedRows.length} rows (${validCount} valid attendees)`)
      } catch (err: any) {
        console.error("Error reading file:", err)
        toast.error("Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.")
        setParsedRows([])
      }
    }

    reader.readAsArrayBuffer(uploadedFile)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const resetState = () => {
    setFile(null)
    setParsedRows([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const validRows = parsedRows.filter((r) => r.isValid)

  // Submit to Bulk API
  const handleBulkSubmit = async () => {
    if (validRows.length === 0) {
      toast.error("No valid attendee records found to import.")
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/camp/members/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendees: validRows }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(data.message || `Successfully registered ${validRows.length} attendees!`)
        onSuccess()
        onOpenChange(false)
        resetState()
      } else {
        toast.error(data.error || "Failed to bulk import attendees.")
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred during bulk import.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!loading) {
          onOpenChange(v)
          if (!v) resetState()
        }
      }}
    >
      <DialogContent className="max-w-3xl bg-card max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <DialogTitle className="text-xl font-bold">
                Bulk Import Attendees via Excel
              </DialogTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary/10"
              onClick={handleDownloadTemplate}
            >
              <Download className="w-3.5 h-3.5" />
              Download Template (.xlsx)
            </Button>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Upload an Excel (.xlsx, .xls) or CSV file with attendee names. Badge IDs and room allocations will be generated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Dropzone */}
          {!file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[0.99]"
                  : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="p-4 bg-primary/10 text-primary rounded-full">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">
                  Click to browse or drag & drop your Excel file here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .xlsx, .xls, and .csv files
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File details bar */}
              <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-600 rounded-lg">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} rows loaded (
                      <span className="text-emerald-600 font-semibold">{validRows.length} valid</span>)
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-red-500 hover:bg-red-500/10 gap-1"
                  onClick={resetState}
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                  Remove
                </Button>
              </div>

              {/* Preview Table */}
              <div className="border rounded-xl overflow-hidden bg-background">
                <div className="p-2.5 bg-muted/60 border-b flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Attendee Preview ({parsedRows.length} Rows)</span>
                  <span>Status</span>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y text-xs">
                  {parsedRows.slice(0, 100).map((row, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 flex items-center justify-between gap-2 ${
                        !row.isValid ? "bg-red-500/5 text-muted-foreground" : "hover:bg-muted/20"
                      }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-1 flex-1">
                        <div>
                          <span className="font-bold text-foreground">{row.fullName}</span>
                          <span className="text-[11px] text-muted-foreground ml-1.5">
                            ({row.gender})
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          {row.phone || <span className="italic">No phone</span>}
                        </div>
                        <div className="text-muted-foreground">
                          {row.branch || <span className="italic">No branch</span>}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1.5">
                          {row.caregroup && <span>Group: {row.caregroup}</span>}
                          {row.position === "Leader" && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1 text-purple-600 border-purple-300">
                              Leader
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {row.isValid ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-300 text-[10px] gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Ready
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-300 text-[10px] gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Invalid
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {parsedRows.length > 100 && (
                    <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30">
                      + {parsedRows.length - 100} more attendees will be imported
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {validRows.length > 0 && (
              <span>
                Ready to register <strong className="text-foreground">{validRows.length}</strong> attendees with MOR Badges & Rooms.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>

            <Button
              className="bg-primary text-white hover:bg-primary/90 font-bold gap-2 w-full sm:w-auto shadow-md"
              disabled={validRows.length === 0 || loading}
              onClick={handleBulkSubmit}
            >
              <Sparkles className="w-4 h-4" />
              {loading
                ? "Importing Attendees..."
                : `Import ${validRows.length} Attendees`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
