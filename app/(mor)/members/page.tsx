import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MembersClient } from "./members-client"

export default async function MembersPage() {
    const session = await auth()
    if (!session) redirect("/auth/signin")

    // Fetch groups based on role
    let groups = await db.ministryGroup.findMany({
        orderBy: { name: "asc" },
    })

    // Leaders can only see their own groups
    if (session.user.role === "LEADER") {
        groups = await db.ministryGroup.findMany({
            where: { leaderId: session.user.id },
            orderBy: { name: "asc" },
        })
    }

    // Fetch members based on role
    let members
    if (session.user.role === "ADMIN") {
        // Admin sees all members
        members = await db.member.findMany({
            include: {
                group: true,
                _count: {
                    select: { attendance: { where: { isPresent: true } } }
                }
            },
            orderBy: { name: "asc" }
        })
    } else {
        // Leader sees only members in their groups
        const groupIds = groups.map((g) => g.id)
        members = await db.member.findMany({
            where: { groupId: { in: groupIds } },
            include: {
                group: true,
                _count: {
                    select: { attendance: { where: { isPresent: true } } }
                }
            },
            orderBy: { name: "asc" }
        })
    }

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
                initialMembers={members as any}
                groups={groups}
                userRole={session.user.role as "ADMIN" | "LEADER" | "COORDINATOR"}
            />
        </div>
    )
}
