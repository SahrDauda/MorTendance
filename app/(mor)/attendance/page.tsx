import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AttendanceClient } from "./attendance-client"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
    const session = await auth()
    if (!session) redirect("/auth/signin")

    const [groups, allMembers, cbsLocations, leaders] = await Promise.all([
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
                        id: true,
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
        }),
        db.cBSLocation.findMany({
            select: {
                id: true,
                name: true,
                branchId: true
            },
            orderBy: {
                name: 'asc'
            }
        }),
        db.user.findMany({
            where: {
                role: {
                    in: ["SENIOR_LEADER", "JUNIOR_LEADER", "PROBATION_LEADER", "BRANCH_HEAD", "COORDINATOR"]
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
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

    // Fetch recent attendance sessions for the selected group (if any)
    const recentSessions = await db.attendanceSession.findMany({
        where: {
            type: "SATURDAY_FELLOWSHIP",
            date: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) // Last month
            }
        },
        include: {
            records: {
                include: {
                    member: {
                        select: {
                            id: true,
                            name: true,
                            phoneNumber: true,
                            status: true,
                            group: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            },
            group: {
                select: {
                    id: true,
                    name: true
                }
            },
            recorder: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            date: 'desc'
        },
        take: 10
    })

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
                <p className="text-muted-foreground">Track consistency and growth across all fellowship groups.</p>
            </div>

            <AttendanceClient
                initialGroups={groups as any}
                allMembers={transformedMembers as any}
                cbsLocations={cbsLocations as any}
                leaders={leaders as any}
                recentSessions={recentSessions as any}
                userRole={session.user.role}
            />
        </div>
    )
}
