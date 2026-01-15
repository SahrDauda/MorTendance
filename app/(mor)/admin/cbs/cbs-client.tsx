"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, MapPin, Building2, User } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { addCBSAction } from "../actions"

interface CBSLocation {
    id: string
    name: string
    address?: string
    district?: string
    branchId: string
    leaderId?: string
    branch: { name: string }
    leader?: { name: string }
    _count: { attendanceSessions: number }
}

interface CBSClientProps {
    initialLocations: CBSLocation[]
    branches: { id: string, name: string }[]
    leaders: { id: string, name: string }[]
}

export function CBSClient({ initialLocations, branches, leaders }: CBSClientProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [selectedLocation, setSelectedLocation] = useState<CBSLocation | null>(null)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

    const filteredLocations = initialLocations.filter(loc =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.district?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAddCBS = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData.entries())

        try {
            const result = await addCBSAction(data)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("CBS location added successfully")
                setIsAddDialogOpen(false)
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search locations, branches, or districts..."
                        className="pl-9 bg-background/50 border-border/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4" /> Add CBS Location
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <form onSubmit={handleAddCBS}>
                            <DialogHeader>
                                <DialogTitle>Add New CBS Location</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Location Name</label>
                                    <Input name="name" placeholder="e.g. Central CBS" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Address</label>
                                    <Input name="address" placeholder="Physical address" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">District</label>
                                    <Input name="district" placeholder="e.g. Downtown" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Branch</label>
                                        <Select name="branchId" required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select branch" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches.map(b => (
                                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Leader (Optional)</label>
                                        <Select name="leaderId">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select leader" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {leaders.map(l => (
                                                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Add Location"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/50 bg-muted/20">
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Location</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Branch</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Leader</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px] text-center">Sessions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLocations.map((loc) => (
                                <TableRow 
                                    key={loc.id} 
                                    className="border-border/50 hover:bg-primary/5 transition-colors cursor-pointer"
                                    onClick={() => {
                                        setSelectedLocation(loc)
                                        setIsDetailDialogOpen(true)
                                    }}
                                >
                                    <TableCell>
                                        <div className="font-semibold">{loc.name}</div>
                                        {loc.address && <div className="text-[10px] text-muted-foreground">{loc.address}</div>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-muted/50 font-medium text-[10px] gap-1">
                                            <Building2 className="h-3 w-3" /> {loc.branch.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {loc.leader ? (
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-3 w-3 text-primary" />
                                                <span>{loc.leader.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Unassigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-primary">
                                        {loc._count.attendanceSessions}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {filteredLocations.length === 0 && (
                        <div className="p-12 text-center text-muted-foreground">
                            No CBS locations found.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    {selectedLocation && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    {selectedLocation.name}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Branch</p>
                                        <p className="text-sm font-semibold">
                                            <Badge variant="secondary" className="bg-muted/50 font-medium text-xs gap-1">
                                                <Building2 className="h-3 w-3" /> {selectedLocation.branch.name}
                                            </Badge>
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Leader</p>
                                        <p className="text-sm font-semibold">
                                            {selectedLocation.leader ? (
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-primary" />
                                                    {selectedLocation.leader.name}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic">Unassigned</span>
                                            )}
                                        </p>
                                    </div>
                                    {selectedLocation.address && (
                                        <div className="space-y-1 col-span-2">
                                            <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Address</p>
                                            <p className="text-sm">{selectedLocation.address}</p>
                                        </div>
                                    )}
                                    {selectedLocation.district && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">District</p>
                                            <p className="text-sm">{selectedLocation.district}</p>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Attendance Sessions</p>
                                        <p className="text-sm font-semibold text-primary">{selectedLocation._count.attendanceSessions}</p>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
