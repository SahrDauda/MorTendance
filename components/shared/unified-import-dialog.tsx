"use client"

import { useState, useRef } from "react"
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2, Sparkles, UserPlus, Calendar } from "lucide-react"
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
import { parseGroupAttendanceExcel, ParsedAttendanceSession, ParsedMember } from "@/lib/excel-utils"
import { unifiedBulkImportAction } from "@/app/(mor)/attendance/actions"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface UnifiedImportDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    branches: { id: string, name: string }[]
    groups: { id: string, name: string }[]
}

export function UnifiedImportDialog({
    isOpen,
    onOpenChange,
    branches,
    groups,
}: UnifiedImportDialogProps) {
    const [isParsing, setIsParsing] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [parsedResult, setParsedResult] = useState<{ sessions: ParsedAttendanceSession[], members: ParsedMember[] } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || "")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsParsing(true)
        setError(null)
        setParsedResult(null)

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: "array" })

                const allSheetsData: Record<string, any[][]> = {}
                workbook.SheetNames.forEach(sheetName => {
                    allSheetsData[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 })
                })

                const result = parseGroupAttendanceExcel(allSheetsData, groups)

                if (result.members.length === 0 && result.sessions.length === 0) {
                    throw new Error("No valid data found in the Excel file. please ensure sheets are named correctly (e.g., 'HQ Group')")
                }

                setParsedResult(result)
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
        if (!parsedResult || !selectedBranchId) return

        setIsImporting(true)
        try {
            const result = await unifiedBulkImportAction({
                branchId: selectedBranchId,
                members: parsedResult.members,
                sessions: parsedResult.sessions.map(s => ({
                    ...s,
                    records: s.records.map(r => ({ tempName: r.tempName, isPresent: r.isPresent }))
                }))
            }) as any

            if (result.success) {
                toast.success("Import Successful", {
                    description: `Successfully processed ${parsedResult.members.length} members and ${result.count} attendance sessions.`
                })
                onOpenChange(false)
                setParsedResult(null)
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Unified Bulk Import
                    </DialogTitle>
                    <DialogDescription>
                        Upload your Group Attendance Excel to sync both members and attendance records.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden py-4 space-y-6">
                    <div
                        className={cn(
                            "relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer",
                            parsedResult ? "border-green-500/50 bg-green-500/5" : "border-border hover:border-primary/50 hover:bg-primary/5"
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
                        ) : parsedResult ? (
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        ) : (
                            <Upload className="h-10 w-10 text-muted-foreground" />
                        )}

                        <div className="text-center">
                            <p className="text-sm font-medium">
                                {parsedResult ? "File analyzed successfully" : "Click to upload Group Attendance Excel"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {parsedResult
                                    ? `${parsedResult.members.length} members and ${parsedResult.sessions.length} sessions detected`
                                    : "Multi-sheet Excel supported"}
                            </p>
                        </div>
                    </div>

                    {parsedResult && (
                        <ScrollArea className="h-[200px] rounded-xl border border-border bg-muted/30 p-4">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                                        <UserPlus className="h-3 w-3" /> Members to Sync ({parsedResult.members.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {parsedResult.members.slice(0, 10).map((m, i) => (
                                            <Badge key={i} variant="secondary" className="text-[10px]">
                                                {m.name} ({m.status})
                                            </Badge>
                                        ))}
                                        {parsedResult.members.length > 10 && (
                                            <span className="text-[10px] text-muted-foreground">+{parsedResult.members.length - 10} more...</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                                        <Calendar className="h-3 w-3" /> Attendance Sessions Detected ({parsedResult.sessions.length})
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {parsedResult.sessions.slice(0, 6).map((s, i) => (
                                            <div key={i} className="text-[10px] bg-background p-2 rounded border border-border/50">
                                                <div className="font-bold">{s.notes}</div>
                                                <div className="text-muted-foreground">{s.groupName}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    )}

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
                        disabled={!parsedResult || isImporting}
                        className="gap-2 shadow-lg shadow-primary/20"
                    >
                        {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isImporting ? "Processing Sync..." : "Start Unified Import"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
