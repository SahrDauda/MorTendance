import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MembersClient } from "./members-client"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
    const session = await auth()
    if (!session) redirect("/auth/signin")

    const [members, groups, branches] = await Promise.all([
        db.member.findMany({
            include: {
                group: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                branch: {
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
        db.ministryGroup.findMany({
            select: {
                id: true,
                name: true
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

    // Transform count for client component compatibility
    const transformedMembers = members.map(m => ({
        ...m,
        _count: {
            attendance: m._count.attendanceRecords
        }
    }))

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {session.user.role === "ADMIN" ? "All Members" : "My Members"}
                    </h1>
                    <p className="text-muted-foreground">
                        {session.user.role === "ADMIN"
                            ? "Manage all fellowship members across all groups."
                            : "Manage members in your groups and track their progression."}
                    </p>
                </div>
            </div>

            <MembersClient
                initialMembers={transformedMembers as any}
                groups={groups}
                branches={branches}
                userRole={session.user.role as any}
            />
        </div>
    )
}
