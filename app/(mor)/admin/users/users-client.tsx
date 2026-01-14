"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Shield, User, MoreHorizontal, Mail, Calendar } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { updateUserAction } from "../actions"
import { UserRole } from "@prisma/client"
import { format } from "date-fns"

interface UserData {
    id: string
    name: string
    email: string
    role: UserRole
    createdAt: Date
    managedBranch?: { name: string }
    managedGroups: { name: string }[]
    managedCBS: { name: string }[]
}

interface UsersClientProps {
    initialUsers: UserData[]
}

export function UsersClient({ initialUsers }: UsersClientProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const filteredUsers = initialUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedUser) return

        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        const data = {
            userId: selectedUser.id,
            role: formData.get("role")
        }

        try {
            const result = await updateUserAction(data)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("User updated successfully")
                setIsEditDialogOpen(false)
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
                        placeholder="Search users by name, email, or role..."
                        className="pl-9 bg-background/50 border-border/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/50 bg-muted/20">
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">User</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Role</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Assignments</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px]">Joined</TableHead>
                                <TableHead className="font-bold uppercase tracking-wider text-[10px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id} className="border-border/50 hover:bg-primary/5 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">{user.name}</div>
                                                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="uppercase font-bold text-[9px]">
                                            {user.role.replace("_", " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {user.managedBranch && (
                                                <Badge variant="outline" className="text-[9px] bg-primary/5">Branch Head</Badge>
                                            )}
                                            {user.managedGroups.length > 0 && (
                                                <Badge variant="outline" className="text-[9px] bg-green-500/5">Group Leader</Badge>
                                            )}
                                            {user.managedCBS.length > 0 && (
                                                <Badge variant="outline" className="text-[9px] bg-amber-500/5">CBS Leader</Badge>
                                            )}
                                            {!user.managedBranch && user.managedGroups.length === 0 && user.managedCBS.length === 0 && (
                                                <span className="text-[10px] text-muted-foreground italic">None</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-[10px] text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(user.createdAt), "MMM d, yyyy")}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full"
                                            onClick={() => {
                                                setSelectedUser(user)
                                                setIsEditDialogOpen(true)
                                            }}
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    {selectedUser && (
                        <form onSubmit={handleUpdateUser}>
                            <DialogHeader>
                                <DialogTitle>Edit User Role</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2 text-center pb-2">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                                        <User className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="font-bold">{selectedUser.name}</h3>
                                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">System Role</label>
                                    <Select name="role" defaultValue={selectedUser.role}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(UserRole).map(role => (
                                                <SelectItem key={role} value={role}>
                                                    {role.replace("_", " ")}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? "Updating..." : "Update User"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
