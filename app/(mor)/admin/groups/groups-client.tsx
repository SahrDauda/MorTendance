"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Building2, User, MoreHorizontal, Users } from "lucide-react"
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
import { addGroupAction } from "../actions"

interface Group {
    id: string
    name: string
    branchId?: string
    leaderId?: string
    branch?: { name: string }
    leader?: { name: string }
    _count: { members: number }
}

interface GroupsClientProps {
    initialGroups: Group[]
    branches: { id: string, name: string }[]
    leaders: { id: string, name: string }[]
}

export function GroupsClient({ initialGroups, branches, leaders }: GroupsClientProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const filteredGroups = initialGroups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.branch?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.leader?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAddGroup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData.entries())

        try {
            const result = await addGroupAction(data)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Group added successfully")
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
                        placeholder="Search groups, branches, or leaders..."
                        className="pl-9 bg-background/50 border-border/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4" /> Add Ministry Group
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                        <form onSubmit={handleAddGroup}>
                            <DialogHeader>
                                <DialogTitle>Add New Ministry Group</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Group Name</label>
                                    <Input name="name" placeholder="e.g. Youth Fellowship" required />
                                </div>
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
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Add Group"}
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
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Group Name</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Branch</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Leader</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px] text-center">Members</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredGroups.map((group) => (
                                <TableRow key={group.id} className="border-border/50 hover:bg-primary/5 transition-colors">
                                    <TableCell className="font-semibold">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-primary" />
                                            {group.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {group.branch ? (
                                            <Badge variant="secondary" className="bg-muted/50 font-medium text-[10px] gap-1">
                                                <Building2 className="h-3 w-3" /> {group.branch.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">No Branch</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {group.leader ? (
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-3 w-3 text-muted-foreground" />
                                                <span>{group.leader.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Unassigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-primary">
                                        {group._count.members}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {filteredGroups.length === 0 && (
                        <div className="p-12 text-center text-muted-foreground">
                            No ministry groups found.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
