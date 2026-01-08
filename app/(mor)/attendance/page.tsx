import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AttendanceClient } from "./attendance-client"

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
    const session = await auth()
    if (!session) redirect("/auth/signin")

    console.log("[AttendancePage] Using mock data")

    // Mock groups
    const groups = [
        {
            id: "group-1",
            name: "Huiothesia",
            members: [
                { id: "m1", name: "Mock Member 1", status: "ESTABLISHED" },
                { id: "m2", name: "Mock Member 2", status: "PRELIMINARY" },
            ]
        }
    ]

    // Mock members
    const allMembers = [
        {
            id: "m1",
            name: "Mock Member 1",
            status: "ESTABLISHED",
            groupId: "group-1",
            group: { name: "Huiothesia" },
            _count: { attendance: 10 }
        },
        {
            id: "m2",
            name: "Mock Member 2",
            status: "PRELIMINARY",
            groupId: "group-1",
            group: { name: "Huiothesia" },
            _count: { attendance: 2 }
        }
    ]

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
                <p className="text-muted-foreground">Track consistency and growth across all fellowship groups.</p>
            </div>

            <AttendanceClient
                initialGroups={groups as any}
                allMembers={allMembers as any}
                userRole={session.user.role}
            />
        </div>
    )
}
