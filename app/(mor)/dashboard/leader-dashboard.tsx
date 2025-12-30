import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import {
    Users,
    ClipboardCheck,
    TrendingUp,
    Award,
} from "lucide-react"
import { LeaderDashboardClient } from "./leader-dashboard-client"

export async function LeaderDashboard() {
    try {
        const session = await auth()
        if (!session) return null

        // Get leader's groups
        const leaderGroups = await db.ministryGroup.findMany({
            where: { leaderId: session.user.id },
            include: {
                members: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                    },
                },
                _count: {
                    select: { members: true },
                },
            },
        })

        // Get members in leader's groups
        const groupMemberIds = leaderGroups.flatMap((group) => group.members.map((m) => m.id))

        const totalMembers = await db.member.count({
            where: { id: { in: groupMemberIds } },
        })

        const establishedMembers = await db.member.count({
            where: {
                id: { in: groupMemberIds },
                status: "ESTABLISHED",
            },
        })

        const newMembers = await db.member.count({
            where: {
                id: { in: groupMemberIds },
                status: "PRELIMINARY",
            },
        })

        // Calculate attendance for leader's groups
        const attendanceRecords = await db.attendance.count({
            where: { memberId: { in: groupMemberIds } },
        })

        const presentRecords = await db.attendance.count({
            where: {
                memberId: { in: groupMemberIds },
                isPresent: true,
            },
        })

        const attendanceRate = attendanceRecords > 0
            ? Math.round((presentRecords / attendanceRecords) * 100)
            : 0

        const stats = [
            { name: "My Members", value: totalMembers.toString(), iconName: "Users" as const, color: "text-blue-500", trend: "In my groups" },
            { name: "Attendance Rate", value: `${attendanceRate}%`, iconName: "ClipboardCheck" as const, color: "text-green-500", trend: "Group consistency" },
            { name: "New Members", value: newMembers.toString(), iconName: "TrendingUp" as const, color: "text-amber-500", trend: "Preliminary status" },
            { name: "Established", value: establishedMembers.toString(), iconName: "Award" as const, color: "text-purple-500", trend: "Consistent growth" },
        ]

        // Get all members for the attendance modal
        const allMembers = await db.member.findMany({
            where: { groupId: { in: leaderGroups.map(g => g.id) } },
            include: {
                group: {
                    select: { name: true },
                },
                _count: {
                    select: { attendance: true },
                },
            },
        }).then(members => members.map(m => ({
            ...m,
            phoneNumber: m.phoneNumber ?? undefined,
        })))

        return (
            <LeaderDashboardClient
                leaderName={session.user.name || "Leader"}
                stats={stats}
                leaderGroups={leaderGroups}
                attendanceRecords={attendanceRecords}
                presentRecords={presentRecords}
                allMembers={allMembers}
            />
        )
    } catch (error) {
        console.error("LeaderDashboard error:", error)
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <h1 className="text-2xl font-bold">Error Loading Leader Dashboard</h1>
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

