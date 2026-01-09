import {
    Users,
    ClipboardCheck,
    ShieldCheck,
    Building2,
} from "lucide-react"
import { db } from "@/lib/db"
import { AdminDashboardClient } from "./admin-dashboard-client"
import { UserRole } from "@prisma/client"

export async function AdminDashboard() {
    try {
        // Real data fetching
        const [
            totalMembers,
            totalLeaders,
            totalGroups,
            totalBranches,
            recentLeaders,
            allGroups,
            allBranches
        ] = await Promise.all([
            db.member.count(),
            db.user.count({
                where: {
                    role: { in: [UserRole.SENIOR_LEADER, UserRole.JUNIOR_LEADER, UserRole.PROBATION_LEADER] }
                }
            }),
            db.ministryGroup.count(),
            db.branch.count(),
            db.user.findMany({
                where: {
                    role: { in: [UserRole.SENIOR_LEADER, UserRole.JUNIOR_LEADER, UserRole.PROBATION_LEADER] }
                },
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                    managedGroups: {
                        select: {
                            id: true,
                            name: true,
                            _count: { select: { members: true } }
                        }
                    }
                }
            }),
            db.ministryGroup.findMany({
                select: { id: true, name: true }
            }),
            db.branch.findMany({
                select: { id: true, name: true }
            })
        ])

        // Calculate attendance rate (placeholder logic for now as we don't have enough data)
        const attendanceRate = 0

        const stats = [
            { name: "Total Members", value: totalMembers.toString(), iconName: "Users" as const, color: "text-blue-500", trend: "Across all groups" },
            { name: "Leaders", value: totalLeaders.toString(), iconName: "ShieldCheck" as const, color: "text-purple-500", trend: "Active leaders" },
            { name: "Groups", value: totalGroups.toString(), iconName: "Building2" as const, color: "text-green-500", trend: "Ministry groups" },
            { name: "Branches", value: totalBranches.toString(), iconName: "Building2" as const, color: "text-amber-500", trend: "Active locations" },
        ]

        return (
            <AdminDashboardClient
                stats={stats}
                leaders={recentLeaders as any}
                groups={allGroups}
                branches={allBranches}
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

