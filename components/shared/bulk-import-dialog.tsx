"use client"

import { useState, useRef } from "react"
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface BulkImportDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    templateHeaders: string[]
    onImport: (data: any[]) => Promise<{ success: boolean; count?: number; error?: string }>
    sampleData?: any[]
}

export function BulkImportDialog({
    isOpen,
    onOpenChange,
    title,
    description,
    templateHeaders,
    onImport,
    sampleData
}: BulkImportDialogProps) {
    const [isParsing, setIsParsing] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [parsedData, setParsedData] = useState<any[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet(sampleData || [
            templateHeaders.reduce((acc, header) => ({ ...acc, [header]: "" }), {})
        ])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Template")
        XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, "_")}_template.xlsx`)
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsParsing(true)
        setError(null)
        setParsedData(null)

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: "array" })
                const firstSheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[firstSheetName]
                const jsonData = XLSX.utils.sheet_to_json(worksheet)

                if (jsonData.length === 0) {
                    throw new Error("The file is empty")
                }

                // Basic header validation
                const headers = Object.keys(jsonData[0] as object)
                const missingHeaders = templateHeaders.filter(h => !headers.includes(h))

                if (missingHeaders.length > 0) {
                    throw new Error(`Missing required columns: ${missingHeaders.join(", ")}`)
                }

                setParsedData(jsonData)
            } catch (err: any) {
                setError(err.message || "Failed to parse file")
                toast.error("File Error", { description: err.message })
            } finally {
                setIsParsing(false)
            }
        }
        reader.readAsArrayBuffer(file)
    }

    const handleImport = async () => {
        if (!parsedData) return

        setIsImporting(true)
        try {
            const result = await onImport(parsedData)
            if (result.success) {
                toast.success("Import Successful", {
                    description: `Successfully imported ${result.count} records.`
                })
                onOpenChange(false)
                setParsedData(null)
                if (fileInputRef.current) fileInputRef.current.value = ""
                setTimeout(() => window.location.reload(), 1000)
            } else {
                setError(result.error || "Failed to import data")
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred")
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold">Step 1: Download Template</p>
                            <p className="text-xs text-muted-foreground">Get the correct format for your data.</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2">
                            <Download className="h-4 w-4" />
                            Template
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm font-semibold">Step 2: Upload & Preview</p>
                        <div
                            className={cn(
                                "relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3",
                                parsedData ? "border-green-500/50 bg-green-500/5" : "border-border hover:border-primary/50 hover:bg-primary/5"
                            )}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                accept=".csv, .xlsx, .xls"
                                onChange={handleFileUpload}
                            />

                            {isParsing ? (
                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            ) : parsedData ? (
                                <CheckCircle2 className="h-10 w-10 text-green-500" />
                            ) : (
                                <Upload className="h-10 w-10 text-muted-foreground" />
                            )}

                            <div className="text-center">
                                <p className="text-sm font-medium">
                                    {parsedData ? "File uploaded successfully" : "Click to upload or drag and drop"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {parsedData ? `${parsedData.length} rows found` : "CSV or Excel files only"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="rounded-xl">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!parsedData || isImporting}
                        className="gap-2"
                    >
                        {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isImporting ? "Importing..." : "Start Import"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

