"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CheckCircle2, UserPlus, Search, Loader2, ArrowLeft, ArrowRight, UserCheck } from "lucide-react"
import { memberCheckInAction, firstTimerCheckInAction } from "./actions"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Member {
    id: string
    name: string
    isPresent?: boolean
}

interface JoinClientProps {
    sessionId: string
    sessionType: string
    branchName: string
    groupName: string
    members: Member[]
}

export function JoinClient({
    sessionId,
    sessionType,
    branchName,
    groupName,
    members: initialMembers
}: JoinClientProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [mode, setMode] = useState<"list" | "newcomer" | "success">("list")
    const [checkedInName, setCheckedInName] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set())

    // First timer form state
    const [newcomerName, setNewcomerName] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [gender, setGender] = useState<"MALE" | "FEMALE" | "">("")
    const [invitedBy, setInvitedBy] = useState("")

    const filteredMembers = useMemo(() => {
        return initialMembers.filter(m =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => a.name.localeCompare(b.name))
    }, [initialMembers, searchQuery])

    const handleMemberCheckIn = async (member: Member) => {
        if (checkedInIds.has(member.id)) return

        setIsSubmitting(true)
        try {
            const result = await memberCheckInAction(sessionId, member.id)
            if (result.success) {
                setCheckedInIds(prev => new Set(prev).add(member.id))
                setCheckedInName(result.memberName!)
                setMode("success")
                toast.success(`Welcome, ${result.memberName}!`)
                // Redirect after brief delay
                setTimeout(() => {
                    window.location.href = "https://morsl.netlify.app"
                }, 1500)
            } else {
                toast.error(result.error || "Failed to check in")
            }
        } catch (error) {
            toast.error("Connection error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleNewcomerSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newcomerName.trim()) return

        setIsSubmitting(true)
        try {
            const result = await firstTimerCheckInAction({
                sessionId,
                name: newcomerName,
                phoneNumber: phoneNumber.trim() || undefined,
                gender: gender || undefined,
                invitedBy: invitedBy && invitedBy !== 'none' ? invitedBy : undefined
            })

            if (result.success) {
                setCheckedInName(result.memberName!)
                setMode("success")
                toast.success(`Welcome to MOR, ${result.memberName}!`)
                // Redirect after brief delay
                setTimeout(() => {
                    window.location.href = "https://morsl.netlify.app"
                }, 1500)
            } else {
                toast.error(result.error || "Registration failed")
            }
        } catch (error) {
            toast.error("Connection error")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (mode === "success") {
        return (
            <Card className="w-full max-w-md border-none shadow-2xl bg-card/80 backdrop-blur-xl">
                <CardContent className="pt-12 pb-8 flex flex-col items-center text-center space-y-6">
                    <div className="h-24 w-24 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-foreground">Welcome, {checkedInName}!</h2>
                        <p className="text-muted-foreground">
                            Your attendance for <span className="font-bold text-primary">{sessionType.replace("_", " ")}</span> has been recorded.
                        </p>
                    </div>
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 w-full">
                        <p className="text-sm font-medium">Branch: {branchName}</p>
                        <p className="text-sm text-muted-foreground">{groupName}</p>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full rounded-xl h-12"
                        onClick={() => {
                            setSearchQuery("")
                            setMode("list")
                        }}
                    >
                        Close
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (mode === "newcomer") {
        return (
            <Card className="w-full max-w-lg border-none shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden">
                <div className="h-2 bg-primary" />
                <CardHeader className="space-y-1 pt-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="ghost" size="icon" onClick={() => setMode("list")} className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="p-2 rounded-xl bg-primary/10">
                            <UserPlus className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">I'm new here! 👋</CardTitle>
                    <CardDescription>
                        We're so glad you joined us today. Please tell us a bit about yourself.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                    <form onSubmit={handleNewcomerSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="newcomerName">Full Name</Label>
                            <Input
                                id="newcomerName"
                                placeholder="What's your name?"
                                value={newcomerName}
                                onChange={e => setNewcomerName(e.target.value)}
                                className="h-12 rounded-xl"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                placeholder="Your phone number"
                                value={phoneNumber}
                                onChange={e => setPhoneNumber(e.target.value)}
                                className="h-12 rounded-xl"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select value={gender} onValueChange={(val: "MALE" | "FEMALE") => setGender(val)} disabled={isSubmitting}>
                                <SelectTrigger className="h-12 rounded-xl text-base" id="gender">
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MALE">Male</SelectItem>
                                    <SelectItem value="FEMALE">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invitedBy">Who invited you? (Optional)</Label>
                            <Select value={invitedBy} onValueChange={setInvitedBy} disabled={isSubmitting}>
                                <SelectTrigger className="h-12 rounded-xl text-base" id="invitedBy">
                                    <SelectValue placeholder="Select a member..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[250px]">
                                    <SelectItem value="none">None / Walk-in</SelectItem>
                                    {initialMembers.slice().sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                                        <SelectItem key={m.id} value={m.name}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-14 rounded-xl shadow-lg shadow-primary/20 text-lg font-bold"
                            disabled={isSubmitting || !newcomerName.trim()}
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                                "Confirm & Join"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-lg border-none shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden flex flex-col h-[85vh] max-h-[800px]">
            <div className="h-2 bg-primary" />
            <CardHeader className="space-y-1 pt-8 pb-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Check-in</CardTitle>
                        <CardDescription>
                            {branchName} • {sessionType.replace("_", " ")}
                        </CardDescription>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-primary/10">
                        <UserCheck className="h-6 w-6 text-primary" />
                    </div>
                </div>
                <div className="relative mt-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search your name..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 rounded-xl bg-background/50 border-border/50 focus:ring-primary"
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto min-h-0 px-4">
                <div className="space-y-2 py-2">
                    {filteredMembers.length > 0 ? (
                        filteredMembers.map((member) => (
                            <button
                                key={member.id}
                                disabled={isSubmitting || checkedInIds.has(member.id)}
                                onClick={() => handleMemberCheckIn(member)}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 border text-left",
                                    checkedInIds.has(member.id)
                                        ? "bg-green-500/10 border-green-500/20 opacity-80"
                                        : "bg-background/40 border-border/50 hover:bg-background/80 hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
                                )}
                            >
                                <span className={cn(
                                    "font-medium text-lg",
                                    checkedInIds.has(member.id) ? "text-green-600" : "text-foreground"
                                )}>
                                    {member.name}
                                </span>
                                {checkedInIds.has(member.id) ? (
                                    <div className="bg-green-500 rounded-full p-1">
                                        <CheckCircle2 className="h-5 w-5 text-white" />
                                    </div>
                                ) : (
                                    <div className="bg-primary/5 rounded-full p-2 group-hover:bg-primary/10">
                                        <ArrowRight className="h-5 w-5 text-primary" />
                                    </div>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <p>No matches found.</p>
                            <p className="text-sm">Maybe you're visiting for the first time?</p>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 bg-muted/30 border-t border-border/50">
                <Button
                    variant="ghost"
                    className="w-full h-14 rounded-xl text-primary font-bold gap-2 hover:bg-primary/10"
                    onClick={() => setMode("newcomer")}
                >
                    <UserPlus className="h-5 w-5" />
                    I'm new here 👋
                </Button>
            </CardFooter>
        </Card>
    )
}
