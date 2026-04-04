"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2, UserPlus, ArrowRight } from "lucide-react"
import { checkInAction } from "./actions"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface CheckInClientProps {
    branchId: string
    branchName: string
    eventType: string
    sessionId?: string
}

export function CheckInClient({ branchId, branchName, eventType, sessionId }: CheckInClientProps) {
    const [identifier, setIdentifier] = useState("")
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "not_found">("idle")
    const [message, setMessage] = useState("")
    const [memberInfo, setMemberInfo] = useState<{ name: string; group: string } | null>(null)

    const handleCheckIn = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!identifier) return

        setStatus("loading")
        try {
            const result = await checkInAction({
                identifier,
                branchId,
                type: eventType,
                sessionId
            })

            if (result.success) {
                setStatus("success")
                setMemberInfo({ name: result.memberName!, group: result.groupName! })
            } else if (result.error === "MEMBER_NOT_FOUND") {
                setStatus("not_found")
            } else {
                setStatus("error")
                setMessage(result.error || "Something went wrong")
            }
        } catch (error) {
            setStatus("error")
            setMessage("Failed to connect to the server")
        }
    }

    if (status === "success") {
        return (
            <Card className="w-full max-w-md border-none shadow-2xl bg-card/80 backdrop-blur-xl">
                <CardContent className="pt-12 pb-8 flex flex-col items-center text-center space-y-6">
                    <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-foreground">Welcome, {memberInfo?.name}!</h2>
                        <p className="text-muted-foreground">
                            Your attendance for <span className="font-bold text-primary">{eventType.replace("_", " ")}</span> at <span className="font-bold text-primary">{branchName}</span> has been recorded.
                        </p>
                    </div>
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 w-full">
                        <p className="text-sm font-medium">Group: {memberInfo?.group}</p>
                    </div>
                    <Button variant="outline" className="w-full rounded-xl h-12" onClick={() => {
                        setIdentifier("")
                        setStatus("idle")
                    }}>
                        Check-in another person
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md border-none shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader className="space-y-1 pt-8">
                <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-2xl bg-primary/10">
                        <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold text-center">Self Check-in</CardTitle>
                <CardDescription className="text-center">
                    {branchName} • {eventType.replace("_", " ")}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
                {status === "error" && (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm">
                        <XCircle className="h-5 w-5 shrink-0" />
                        <p>{message}</p>
                    </div>
                )}

                {status === "not_found" ? (
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center text-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <UserPlus className="h-6 w-6 text-amber-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-amber-700">Member Not Found</p>
                                <p className="text-xs text-amber-600/80">We couldn't find a member with that information. Are you new to the ministry?</p>
                            </div>
                        </div>
                        <div className="grid gap-3">
                            <Button asChild className="w-full h-12 rounded-xl gap-2 shadow-lg shadow-primary/20">
                                <Link href={`/check-in/new?branchId=${branchId}&type=${eventType}`}>
                                    Register as Newcomer <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button variant="ghost" className="w-full h-12 rounded-xl" onClick={() => setStatus("idle")}>
                                Try again
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleCheckIn} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">Phone Number or Name</label>
                            <Input
                                placeholder="Enter your phone number..."
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="h-12 rounded-xl bg-background/50 border-border/50 focus:ring-primary"
                                disabled={status === "loading"}
                                autoFocus
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl shadow-lg shadow-primary/20"
                            disabled={status === "loading" || !identifier}
                        >
                            {status === "loading" ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Checking in...
                                </>
                            ) : (
                                "Check-in Now"
                            )}
                        </Button>
                    </form>
                )}
            </CardContent>
            <CardFooter className="bg-muted/30 border-t border-border/50 p-4 justify-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    Ministry of Reconciliation
                </p>
            </CardFooter>
        </Card>
    )
}
