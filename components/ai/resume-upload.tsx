/**
 * Resume Upload Component
 * Optional resume upload with AI parsing for onboarding
 */

"use client"

import { useState, useRef } from "react"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import type { ParsedResume } from "@/lib/ai/resume-parser"

interface ResumeUploadProps {
    onResumeParsed: (data: ParsedResume) => void
    onSkip?: () => void
}

export function ResumeUpload({ onResumeParsed, onSkip }: ResumeUploadProps) {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [parsing, setParsing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        // Validate file type
        if (selectedFile.type !== "application/pdf" && !selectedFile.name.endsWith(".pdf")) {
            toast({
                title: "Invalid file type",
                description: "Please upload a PDF file",
                variant: "destructive",
            })
            return
        }

        // Validate file size (10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Please upload a file smaller than 10MB",
                variant: "destructive",
            })
            return
        }

        setFile(selectedFile)
    }

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        setParsing(true)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/ai/parse-resume", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to parse resume")
            }

            const data = await response.json()
            if (data.success && data.data) {
                onResumeParsed(data.data)
                toast({
                    title: "Resume parsed successfully",
                    description: "Your resume has been analyzed. Please review and edit the information below.",
                })
            } else {
                throw new Error("Invalid response from server")
            }
        } catch (error: any) {
            console.error("[Resume Upload] Error:", error)
            toast({
                title: "Failed to parse resume",
                description: error.message || "Please try again or skip this step",
                variant: "destructive",
            })
        } finally {
            setUploading(false)
            setParsing(false)
        }
    }

    const handleRemove = () => {
        setFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const droppedFile = e.dataTransfer.files?.[0]
        if (droppedFile) {
            const fakeEvent = {
                target: { files: [droppedFile] },
            } as any
            handleFileSelect(fakeEvent)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload Your Resume (Optional)</CardTitle>
                <CardDescription>
                    Upload your resume to automatically fill in your profile information. You can edit everything after.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!file ? (
                    <div
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center transition-colors hover:border-primary/50 cursor-pointer"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm font-medium mb-2">Drag and drop your resume here</p>
                        <p className="text-xs text-muted-foreground mb-4">or click to browse</p>
                        <p className="text-xs text-muted-foreground">PDF files only, max 10MB</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                        <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        {!parsing && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleRemove}
                                className="flex-shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}

                <div className="flex gap-2">
                    {file && !parsing && (
                        <Button onClick={handleUpload} className="flex-1" disabled={uploading}>
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Parsing...
                                </>
                            ) : (
                                <>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Parse Resume
                                </>
                            )}
                        </Button>
                    )}
                    {parsing && (
                        <div className="flex-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyzing your resume...
                        </div>
                    )}
                    {onSkip && (
                        <Button variant="ghost" onClick={onSkip} disabled={parsing}>
                            Skip
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

