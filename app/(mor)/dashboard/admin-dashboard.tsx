import {
    Users,
    ClipboardCheck,
    ShieldCheck,
    Building2,
} from "lucide-react"
import { AdminDashboardClient } from "./admin-dashboard-client"

export async function AdminDashboard() {
    try {
        // Mock data for Admin Dashboard
        const totalMembers = 150
        const totalLeaders = 12
        const totalGroups = 8
        const establishedMembers = 120
        const attendanceRate = 85

        const leaders = [
            {
                id: "mock-leader-1",
                name: "John Leader",
                email: "john@example.com",
                managedGroups: [
                    { id: "g1", name: "Youth Fellowship", _count: { members: 25 } }
                ]
            },
            {
                id: "mock-leader-2",
                name: "Sarah Coordinator",
                email: "sarah@example.com",
                managedGroups: [
                    { id: "g2", name: "Men's Ministry", _count: { members: 30 } },
                    { id: "g3", name: "Prayer Team", _count: { members: 15 } }
                ]
            }
        ]

        const groups = [
            { id: "g1", name: "Youth Fellowship" },
            { id: "g2", name: "Men's Ministry" },
            { id: "g3", name: "Prayer Team" },
            { id: "g4", name: "Women's Fellowship" },
            { id: "g5", name: "Children's Church" },
        ]

        const stats = [
            { name: "Total Members", value: totalMembers.toString(), iconName: "Users" as const, color: "text-blue-500", trend: "Across all groups" },
            { name: "Leaders", value: totalLeaders.toString(), iconName: "ShieldCheck" as const, color: "text-purple-500", trend: "Active leaders" },
            { name: "Groups", value: totalGroups.toString(), iconName: "Building2" as const, color: "text-green-500", trend: "Ministry groups" },
            { name: "Attendance Rate", value: `${attendanceRate}%`, iconName: "ClipboardCheck" as const, color: "text-amber-500", trend: "Overall consistency" },
        ]

        return (
            <AdminDashboardClient
                stats={stats}
                leaders={leaders}
                groups={groups}
            />
        )
    } catch (error) {
        console.error("AdminDashboard error:", error)
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <h1 className="text-2xl font-bold">Error Loading Admin Dashboard</h1>
                <p className="text-muted-foreground">
                    There was an error loading the dashboard. Please try again later.
                </p>
                {process.env.NODE_ENV === "development" && (
                    <pre className="text-xs bg-muted p-4 rounded">{String(error)}</pre>
                )}
            </div>
        )
    }
}

