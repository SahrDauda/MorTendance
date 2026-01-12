"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, Printer, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface Branch {
    id: string
    name: string
}

interface QRGeneratorClientProps {
    branches: Branch[]
}

export function QRGeneratorClient({ branches }: QRGeneratorClientProps) {
    const [selectedBranch, setSelectedBranch] = useState<string>(branches[0]?.id || "")
    const [eventType, setEventType] = useState<string>("SATURDAY_FELLOWSHIP")
    const [baseUrl, setBaseUrl] = useState<string>("")
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        setBaseUrl(window.location.origin)
    }, [])

    const checkInUrl = `${baseUrl}/check-in?branchId=${selectedBranch}&type=${eventType}`

    const handleCopy = () => {
        navigator.clipboard.writeText(checkInUrl)
        setCopied(true)
        toast.success("Link copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
    }

    const handlePrint = () => {
        window.print()
    }

    const branchName = branches.find(b => b.id === selectedBranch)?.name || "Branch"

    return (
        <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                    <CardDescription>Select the branch and event type for the QR code.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Branch</label>
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select branch" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map(branch => (
                                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Event Type</label>
                        <Select value={eventType} onValueChange={setEventType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SATURDAY_FELLOWSHIP">Saturday Fellowship</SelectItem>
                                <SelectItem value="LEADERSHIP_MEETING">Leadership Meeting</SelectItem>
                                <SelectItem value="CBS">CBS</SelectItem>
                                <SelectItem value="EVANGELISM">Evangelism</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="pt-4 space-y-2">
                        <Button className="w-full gap-2" variant="outline" onClick={handleCopy}>
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied!" : "Copy Check-in Link"}
                        </Button>
                        <Button className="w-full gap-2" onClick={handlePrint}>
                            <Printer className="h-4 w-4" /> Print QR Code
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center print:shadow-none print:border-none print:bg-white">
                <div className="space-y-6 flex flex-col items-center">
                    <div className="bg-white p-4 rounded-2xl shadow-xl">
                        {baseUrl && (
                            <QRCodeSVG
                                value={checkInUrl}
                                size={256}
                                level="H"
                                includeMargin={true}
                            />
                        )}
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold">{branchName}</h2>
                        <p className="text-muted-foreground uppercase tracking-widest text-xs font-bold">
                            {eventType.replace("_", " ")}
                        </p>
                    </div>
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 max-w-xs">
                        <p className="text-sm font-medium">Scan this QR code to mark your attendance automatically.</p>
                    </div>
                </div>
            </Card>

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print\\:shadow-none, .print\\:shadow-none * {
                        visibility: visible;
                    }
                    .print\\:shadow-none {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        display: flex !important;
                        align-items: center;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    )
}
