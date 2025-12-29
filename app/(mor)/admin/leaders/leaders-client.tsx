"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { addLeaderAction } from "../actions"
import { Plus, Mail, Users, Building2, Eye, Loader2 } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface Leader {
    id: string
    name: string
    email: string
    createdAt: Date
    managedGroups: Array<{
        id: string
        name: string
        _count: { members: number }
    }>
}

interface Group {
    id: string
    name: string
}

interface LeadersClientProps {
    initialLeaders: Leader[]
    groups: Group[]
}

export function LeadersClient({ initialLeaders, groups }: LeadersClientProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [leaders, setLeaders] = useState(initialLeaders)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        groupId: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const result = await addLeaderAction({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                groupId: formData.groupId || undefined,
            })

            if (result.error) {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                })
                return
            }

            toast({
                title: "Success",
                description: "Leader created successfully!",
            })

            // Reset form
            setFormData({ name: "", email: "", password: "", groupId: "" })
            setIsDialogOpen(false)

            // Refresh the page to get updated data
            router.refresh()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create leader",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>All Leaders</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage and view all fellowship leaders
                        </p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Leader
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>Add New Leader</DialogTitle>
                                    <DialogDescription>
                                        Create a new leader account. You can assign them to a group later.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            placeholder="John Doe"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) =>
                                                setFormData({ ...formData, email: e.target.value })
                                            }
                                            placeholder="leader@example.com"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) =>
                                                setFormData({ ...formData, password: e.target.value })
                                            }
                                            placeholder="Minimum 8 characters"
                                            required
                                            minLength={8}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="groupId">Assign to Group (Optional)</Label>
                                        <Select
                                            value={formData.groupId}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, groupId: value })
                                            }
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a group" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">No group assignment</SelectItem>
                                                {groups.map((group) => (
                                                    <SelectItem key={group.id} value={group.id}>
                                                        {group.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(false)}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            "Create Leader"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Groups</TableHead>
                                    <TableHead>Members</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No leaders found. Add your first leader to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    leaders.map((leader) => (
                                        <TableRow key={leader.id}>
                                            <TableCell className="font-medium">{leader.name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    {leader.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {leader.managedGroups.length === 0 ? (
                                                        <Badge variant="outline">No groups</Badge>
                                                    ) : (
                                                        leader.managedGroups.map((group) => (
                                                            <Badge key={group.id} variant="secondary">
                                                                <Building2 className="h-3 w-3 mr-1" />
                                                                {group.name}
                                                            </Badge>
                                                        ))
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    {leader.managedGroups.reduce(
                                                        (sum, group) => sum + group._count.members,
                                                        0
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {format(new Date(leader.createdAt), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/admin/leaders/${leader.id}`}>
                                                    <Button variant="ghost" size="sm" className="gap-2">
                                                        <Eye className="h-4 w-4" />
                                                        View Details
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

