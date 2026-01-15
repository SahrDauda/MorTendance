"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Building2, User, Users, MapPin } from "lucide-react"
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
import { addBranchAction } from "../actions"

interface Branch {
    id: string
    name: string
    headId?: string
    head?: { name: string }
    _count: {
        members: number
        groups: number
        cbsLocations: number
    }
}

interface BranchesClientProps {
    initialBranches: Branch[]
    leaders: { id: string, name: string }[]
}

export function BranchesClient({ initialBranches, leaders }: BranchesClientProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

    const filteredBranches = initialBranches.filter(branch =>
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.head?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAddBranch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData.entries())

        try {
            const result = await addBranchAction(data)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Branch added successfully")
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
                        placeholder="Search branches or branch heads..."
                        className="pl-9 bg-background/50 border-border/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4" /> Add Branch
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                        <form onSubmit={handleAddBranch}>
                            <DialogHeader>
                                <DialogTitle>Add New Branch</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Branch Name</label>
                                    <Input name="name" placeholder="e.g. Lagos Central" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Branch Head (Optional)</label>
                                    <Select name="headId">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select branch head" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {leaders.map(l => (
                                                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Add Branch"}
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
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Branch Name</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Branch Head</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px] text-center">Groups</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px] text-center">CBS</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px] text-center">Members</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBranches.map((branch) => (
                                <TableRow
                                    key={branch.id}
                                    className="border-border/50 hover:bg-primary/5 transition-colors cursor-pointer"
                                    onClick={() => {
                                        setSelectedBranch(branch)
                                        setIsDetailDialogOpen(true)
                                    }}
                                >
                                    <TableCell className="font-semibold">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-primary" />
                                            {branch.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {branch.head ? (
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-3 w-3 text-muted-foreground" />
                                                <span>{branch.head.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">No Head Assigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="gap-1">
                                            <Users className="h-3 w-3" /> {branch._count.groups}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="gap-1">
                                            <MapPin className="h-3 w-3" /> {branch._count.cbsLocations}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-primary">
                                        {branch._count.members}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {filteredBranches.length === 0 && (
                        <div className="p-12 text-center text-muted-foreground">
                            No branches found.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    {selectedBranch && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-primary" />
                                    {selectedBranch.name}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Branch Head</p>
                                        <p className="text-sm font-semibold">
                                            {selectedBranch.head ? (
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    {selectedBranch.head.name}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic">No Head Assigned</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Total Groups</p>
                                        <p className="text-sm font-semibold text-primary">{selectedBranch._count.groups}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">CBS Locations</p>
                                        <p className="text-sm font-semibold text-amber-500">{selectedBranch._count.cbsLocations}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Total Members</p>
                                        <p className="text-sm font-semibold text-primary">{selectedBranch._count.members}</p>
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
