import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AttendanceClient } from "./attendance-client"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
    const session = await auth()
    if (!session) redirect("/auth/signin")

    const [groups, allMembers] = await Promise.all([
        db.ministryGroup.findMany({
            include: {
                members: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        }),
        db.member.findMany({
            include: {
                group: {
                    select: {
                        name: true
                    }
                },
                _count: {
                    select: {
                        attendanceRecords: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })
    ])

    // Transform members for client component compatibility
    const transformedMembers = allMembers.map(m => ({
        ...m,
        _count: {
            attendance: m._count.attendanceRecords
        }
    }))

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
                <p className="text-muted-foreground">Track consistency and growth across all fellowship groups.</p>
            </div>

            <AttendanceClient
                initialGroups={groups as any}
                allMembers={transformedMembers as any}
                userRole={session.user.role}
            />
        </div>
    )
}
