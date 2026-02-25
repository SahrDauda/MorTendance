"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, QrCode, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getOrCreateSessionForQRAction } from "../actions"

interface Branch {
    id: string
    name: string
}

interface Group {
    id: string
    name: string
    branchId: string | null
}

interface QRGeneratorClientProps {
    branches: Branch[]
    groups: Group[]
}

export function QRGeneratorClient({ branches, groups }: QRGeneratorClientProps) {
    const [selectedBranch, setSelectedBranch] = useState<string>(branches[0]?.id || "")
    const [selectedGroup, setSelectedGroup] = useState<string>("all")
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [localBaseUrl, setLocalBaseUrl] = useState<string>("")

    const PRODUCTION_BASE_URL = "https://morsystem.vercel.app"

    useEffect(() => {
        setLocalBaseUrl(window.location.origin)
    }, [])

    const filteredGroups = groups.filter(g => g.branchId === selectedBranch)

    // Reset session when filters change
    useEffect(() => {
        setSessionId(null)
    }, [selectedBranch, selectedGroup])

    const handleGenerateQR = async () => {
        setIsLoading(true)
        try {
            const result = await getOrCreateSessionForQRAction({
                branchId: selectedBranch,
                groupId: selectedGroup === "all" ? undefined : selectedGroup,
                type: "SATURDAY_FELLOWSHIP"
            })

            if (result.success && result.sessionId) {
                setSessionId(result.sessionId)
                toast.success("Attendance session prepared!")
            } else {
                toast.error(result.error || "Failed to prepare session")
            }
        } catch (error) {
            toast.error("Connection error")
        } finally {
            setIsLoading(false)
        }
    }

    const checkInUrl = sessionId
        ? `${PRODUCTION_BASE_URL}/join/${sessionId}`
        : ""

    const localCheckInUrl = sessionId
        ? `${localBaseUrl}/join/${sessionId}`
        : ""

    const handleDemoScanner = () => {
        if (!localCheckInUrl) return
        window.open(localCheckInUrl, '_blank')
    }

    const branchName = branches.find(b => b.id === selectedBranch)?.name || "Branch"

    return (
        <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Saturday Fellowship QR</CardTitle>
                    <CardDescription>Select the branch to generate a Saturday Fellowship check-in QR.</CardDescription>
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
                        <label className="text-sm font-medium">Select Group (Optional)</label>
                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                            <SelectTrigger>
                                <SelectValue placeholder="All members or specific group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branch Members</SelectItem>
                                {filteredGroups.map(group => (
                                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="pt-4 space-y-4">
                        {!sessionId ? (
                            <Button
                                className="w-full h-12 rounded-xl text-lg font-bold"
                                onClick={handleGenerateQR}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Preparing...
                                    </>
                                ) : (
                                    "Generate QR for Today"
                                )}
                            </Button>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-muted/50 rounded-xl border border-border/50 break-all">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Production Link</p>
                                    <p className="text-xs font-mono">{checkInUrl}</p>
                                </div>
                                <Button
                                    className="w-full h-14 rounded-xl gap-2 font-bold text-lg shadow-xl shadow-primary/20"
                                    onClick={handleDemoScanner}
                                >
                                    <ExternalLink className="h-5 w-5" />
                                    Demo Scanner (Open Locally)
                                </Button>
                                <Button
                                    className="w-full h-10 rounded-xl"
                                    variant="ghost"
                                    onClick={() => setSessionId(null)}
                                >
                                    Reset / Change Filters
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center print:shadow-none print:border-none print:bg-white min-h-[400px]">
                {!sessionId ? (
                    <div className="text-muted-foreground flex flex-col items-center gap-4">
                        <div className="p-6 rounded-full bg-muted">
                            <QRCodeSVG value="placeholder" size={128} className="opacity-10 grayscale" />
                        </div>
                        <p>Fill filters and click generate to see QR code</p>
                    </div>
                ) : (
                    <div className="space-y-6 flex flex-col items-center">
                        <div className="bg-white p-4 rounded-2xl shadow-xl">
                            {localBaseUrl && (
                                <QRCodeSVG
                                    value={checkInUrl}
                                    size={256}
                                    level="H"
                                    includeMargin={true}
                                />
                            )}
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold">{branchName}</h2>
                            {selectedGroup !== "all" && (
                                <p className="text-primary font-medium">
                                    {groups.find(g => g.id === selectedGroup)?.name}
                                </p>
                            )}
                            <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
                                SATURDAY FELLOWSHIP
                            </p>
                        </div>
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 max-w-xs">
                            <p className="text-sm font-medium">Scan this QR code to mark your attendance automatically.</p>
                        </div>
                    </div>
                )}
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
