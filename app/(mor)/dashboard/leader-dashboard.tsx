import { auth } from "@/lib/auth"
import { LeaderDashboardClient } from "./leader-dashboard-client"
import { db } from "@/lib/db"

export async function LeaderDashboard() {
    try {
        const session = await auth()
        if (!session || !session.user) return null

        const leaderId = session.user.id

        // 1. Fetch groups managed by this leader
        const leaderGroups = await db.ministryGroup.findMany({
            where: {
                leaderId: leaderId
            },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                members: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        phoneNumber: true
                    }
                },
                _count: {
                    select: {
                        members: true
                    }
                }
            }
        })

        // 2. Fetch Branch managed by this leader (if any)
        const managedBranch = await db.branch.findUnique({
            where: {
                headId: leaderId
            },
            include: {
                _count: {
                    select: {
                        groups: true,
                        members: true,
                        cbsLocations: true
                    }
                }
            }
        })

        // 3. Fetch CBS Locations managed by this leader (if any)
        const managedCBS = await db.cBSLocation.findMany({
            where: {
                leaderId: leaderId
            },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                _count: {
                    select: {
                        attendanceSessions: true
                    }
                }
            }
        })

        const groupIds = leaderGroups.map(g => g.id)

        // Collect relevant branch IDs (from managed branch or CBS locations)
        const branchIds = new Set<string>()
        if (managedBranch) branchIds.add(managedBranch.id)
        managedCBS.forEach(cbs => {
            if (cbs.branch?.id) branchIds.add(cbs.branch.id)
        })

        // 4. Fetch members:
        // - Members of groups I lead
        // - OR Members of branches I manage
        // - OR Members of branches where I manage a CBS location
        const allMembers = await db.member.findMany({
            where: {
                OR: [
                    { groupId: { in: groupIds } },
                    { branchId: { in: Array.from(branchIds) } }
                ]
            },
            include: {
                group: {
                    select: { name: true }
                },
                _count: {
                    select: { attendanceRecords: true }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        // 5. Calculate Stats
        const totalMembers = allMembers.length
        const establishedMembers = allMembers.filter(m => m.status === "ESTABLISHED").length
        const newMembers = allMembers.filter(m => m.status === "PRELIMINARY").length

        const totalAttendanceRecords = await db.attendanceRecord.count({
            where: {
                member: {
                    groupId: { in: groupIds }
                }
            }
        })

        const presentRecords = await db.attendanceRecord.count({
            where: {
                member: {
                    groupId: { in: groupIds }
                },
                isPresent: true
            }
        })

        const attendanceRate = totalAttendanceRecords > 0
            ? Math.round((presentRecords / totalAttendanceRecords) * 100)
            : 0

        const stats = [
            { name: "My Members", value: totalMembers.toString(), iconName: "Users" as const, color: "text-blue-500", trend: "In my groups" },
            { name: "Attendance Rate", value: `${attendanceRate}%`, iconName: "ClipboardCheck" as const, color: "text-green-500", trend: "Group consistency" },
            { name: "New Members", value: newMembers.toString(), iconName: "TrendingUp" as const, color: "text-amber-500", trend: "Preliminary status" },
            { name: "Established", value: establishedMembers.toString(), iconName: "Award" as const, color: "text-purple-500", trend: "Consistent growth" },
        ]

        // Transform members for client component
        const transformedMembers = allMembers.map(m => ({
            ...m,
            _count: {
                attendance: m._count.attendanceRecords
            }
        }))

        return (
            <LeaderDashboardClient
                leaderName={session.user.name || "Leader"}
                stats={stats}
                leaderGroups={leaderGroups as any}
                managedBranch={managedBranch as any}
                managedCBS={managedCBS as any}
                attendanceRecords={totalAttendanceRecords}
                presentRecords={presentRecords}
                allMembers={transformedMembers as any}
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
