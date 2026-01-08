import { auth } from "@/lib/auth"
import { LeaderDashboardClient } from "./leader-dashboard-client"

export async function LeaderDashboard() {
    try {
        const session = await auth()
        if (!session) return null

        console.log("[LeaderDashboard] Using mock data")

        // Mock stats
        const stats = [
            { name: "My Members", value: "24", iconName: "Users" as const, color: "text-blue-500", trend: "In my groups" },
            { name: "Attendance Rate", value: "85%", iconName: "ClipboardCheck" as const, color: "text-green-500", trend: "Group consistency" },
            { name: "New Members", value: "5", iconName: "TrendingUp" as const, color: "text-amber-500", trend: "Preliminary status" },
            { name: "Established", value: "12", iconName: "Award" as const, color: "text-purple-500", trend: "Consistent growth" },
        ]

        // Mock groups
        const leaderGroups = [
            {
                id: "group-1",
                name: "Huiothesia",
                members: [],
                _count: { members: 12 }
            },
            {
                id: "group-2",
                name: "Doxasmus",
                members: [],
                _count: { members: 12 }
            }
        ]

        // Mock members
        const allMembers = Array.from({ length: 10 }).map((_, i) => ({
            id: `member-${i}`,
            name: `Mock Member ${i + 1}`,
            status: i % 3 === 0 ? "ESTABLISHED" : (i % 2 === 0 ? "SEMI_CONSISTENT" : "PRELIMINARY"),
            groupId: i < 5 ? "group-1" : "group-2",
            group: { name: i < 5 ? "Huiothesia" : "Doxasmus" },
            phoneNumber: "123-456-7890",
            _count: { attendance: 5 }
        }))

        return (
            <LeaderDashboardClient
                leaderName={session.user.name || "Leader"}
                stats={stats}
                leaderGroups={leaderGroups as any}
                attendanceRecords={100}
                presentRecords={85}
                allMembers={allMembers as any}
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
            </div>
        )
    }
}
