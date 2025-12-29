import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AttendanceClient } from "./attendance-client"

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
    const session = await auth()
    if (!session) redirect("/auth/signin")

    // Fetch groups the user can manage
    const groups = await db.ministryGroup.findMany({
        where: session.user.role === "LEADER"
            ? { leaderId: session.user.id }
            : {},
        include: {
            members: {
                orderBy: { name: "asc" }
            }
        }
    })

    // Fetch all members for the "Add Attendance" modal and dashboard
    const allMembers = await db.member.findMany({
        include: {
            _count: {
                select: { attendance: true }
            },
            group: {
                select: { name: true }
            }
        },
        orderBy: {
            attendance: {
                _count: 'desc'
            }
        }
    })

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
