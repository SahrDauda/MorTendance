import { db } from "@/lib/db"
import {
    Users,
    ClipboardCheck,
    ShieldCheck,
    Building2,
} from "lucide-react"
import { AdminDashboardClient } from "./admin-dashboard-client"

export async function AdminDashboard() {
    // Fetch admin-specific stats
    const totalMembers = await db.member.count()
    const totalLeaders = await db.user.count({ where: { role: "LEADER" } })
    const totalGroups = await db.ministryGroup.count()
    const establishedMembers = await db.member.count({ where: { status: "ESTABLISHED" } })

    // Calculate average attendance
    const totalAttendanceRecords = await db.attendance.count()
    const presentRecords = await db.attendance.count({ where: { isPresent: true } })
    const attendanceRate = totalAttendanceRecords > 0
        ? Math.round((presentRecords / totalAttendanceRecords) * 100)
        : 0

    // Get leaders with their groups
    const leaders = await db.user.findMany({
        where: { role: "LEADER" },
        include: {
            managedGroups: {
                include: {
                    _count: {
                        select: { members: true },
                    },
                },
            },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
    })

    // Get all groups for the add member modal
    const groups = await db.ministryGroup.findMany({
        select: {
            id: true,
            name: true,
        },
        orderBy: { name: "asc" },
    })

    const stats = [
        { name: "Total Members", value: totalMembers.toString(), icon: Users, color: "text-blue-500", trend: "Across all groups" },
        { name: "Leaders", value: totalLeaders.toString(), icon: ShieldCheck, color: "text-purple-500", trend: "Active leaders" },
        { name: "Groups", value: totalGroups.toString(), icon: Building2, color: "text-green-500", trend: "Ministry groups" },
        { name: "Attendance Rate", value: `${attendanceRate}%`, icon: ClipboardCheck, color: "text-amber-500", trend: "Overall consistency" },
    ]

    return (
        <AdminDashboardClient
            stats={stats}
            leaders={leaders}
            groups={groups}
        />
    )
}

