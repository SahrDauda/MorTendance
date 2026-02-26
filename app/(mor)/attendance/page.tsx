import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AttendanceClient } from "./attendance-client"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
    const session = await auth()
    if (!session) redirect("/auth/signin")

    const [groups, allMembers, cbsLocations, leaders, branches] = await Promise.all([
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
        }),
        db.branch.findMany({
            select: {
                id: true,
                name: true
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

    // Compute today's date range (server time) for Saturday Fellowship overview
    const today = new Date()
    const startOfToday = new Date(today)
    startOfToday.setHours(0, 0, 0, 0)
    const startOfTomorrow = new Date(startOfToday)
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)

    // Fetch recent Saturday Fellowship attendance sessions (last month)
    const [recentSessions, todaysSaturdaySessions] = await Promise.all([
        db.attendanceSession.findMany({
            where: {
                type: "SATURDAY_FELLOWSHIP",
                date: {
                    gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) // Last month
                }
            },
            include: {
                records: {
                    select: {
                        id: true,
                        memberId: true,
                        isPresent: true,
                        isLate: true,
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
        }),
        db.attendanceSession.findMany({
            where: {
                type: "SATURDAY_FELLOWSHIP",
                date: {
                    gte: startOfToday,
                    lt: startOfTomorrow
                }
            },
            select: {
                id: true,
                groupId: true,
            }
        })
    ])

    const todaysSaturdayGroupIds = todaysSaturdaySessions
        .map((s) => s.groupId)
        .filter((id): id is string => !!id)

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
                <p className="text-muted-foreground">
                    Focus on today&apos;s Saturday Fellowship attendance first, then other gatherings.
                </p>
            </div>

            <AttendanceClient
                initialGroups={groups as any}
                allMembers={transformedMembers as any}
                cbsLocations={cbsLocations as any}
                leaders={leaders as any}
                recentSessions={recentSessions as any}
                userRole={session.user.role}
                todaysSaturdayGroupIds={todaysSaturdayGroupIds}
                branches={branches as any}
                initialDate={today.getTime()}
            />
        </div>
    )
}
