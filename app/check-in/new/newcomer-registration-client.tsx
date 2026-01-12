"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, UserPlus, CheckCircle2, ArrowLeft } from "lucide-react"
import { registerNewcomerAction } from "./actions"
import { EventType, Gender } from "@prisma/client"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface NewcomerRegistrationClientProps {
    groups: { id: string; name: string }[]
    branches: { id: string; name: string }[]
    initialBranchId?: string
    initialType: EventType
}

export function NewcomerRegistrationClient({
    groups,
    branches,
    initialBranchId,
    initialType
}: NewcomerRegistrationClientProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        name: "",
        phoneNumber: "",
        address: "",
        gender: "MALE" as Gender,
        groupId: groups[0]?.id || "",
        branchId: initialBranchId || branches[0]?.id || "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError("")

        try {
            const result = await registerNewcomerAction({
                ...formData,
                eventType: initialType
            })

            if (result.success) {
                setIsSuccess(true)
            } else {
                setError(result.error || "Failed to register")
            }
        } catch (err) {
            setError("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSuccess) {
        return (
            <Card className="w-full max-w-md border-none shadow-2xl bg-card/80 backdrop-blur-xl">
                <CardContent className="pt-12 pb-8 flex flex-col items-center text-center space-y-6">
                    <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-foreground">Welcome to MOR!</h2>
                        <p className="text-muted-foreground">
                            Your registration is complete and your attendance for <span className="font-bold text-primary">{initialType.replace("_", " ")}</span> has been recorded.
                        </p>
                    </div>
                    <Button className="w-full rounded-xl h-12" onClick={() => router.push("/")}>
                        Go to Home
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-lg border-none shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader className="space-y-1 pt-8">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link href={`/check-in?branchId=${initialBranchId}&type=${initialType}`}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="p-2 rounded-xl bg-primary/10">
                        <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold">Newcomer Registration</CardTitle>
                <CardDescription>
                    We're glad to have you! Please fill in your details to join the fellowship.
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="rounded-xl"
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                required
                                value={formData.phoneNumber}
                                onChange={e => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                className="rounded-xl"
                                placeholder="077..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            className="rounded-xl"
                            placeholder="123 Street, City"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Gender</Label>
                        <RadioGroup
                            value={formData.gender}
                            onValueChange={v => setFormData(prev => ({ ...prev, gender: v as Gender }))}
                            className="flex gap-6"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="MALE" id="male" />
                                <Label htmlFor="male" className="font-normal">Male</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="FEMALE" id="female" />
                                <Label htmlFor="female" className="font-normal">Female</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Fellowship Group</Label>
                            <Select
                                value={formData.groupId}
                                onValueChange={v => setFormData(prev => ({ ...prev, groupId: v }))}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select group" />
                                </SelectTrigger>
                                <SelectContent>
                                    {groups.map(g => (
                                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Branch</Label>
                            <Select
                                value={formData.branchId}
                                onValueChange={v => setFormData(prev => ({ ...prev, branchId: v }))}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl shadow-lg shadow-primary/20"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Registering...
                            </>
                        ) : (
                            "Complete Registration"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
