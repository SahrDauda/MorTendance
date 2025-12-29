import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MembersClient } from "./members-client"

export default async function MembersPage() {
    const session = await auth()
    if (!session) redirect("/auth/signin")

    // Fetch all members and groups
    const members = await db.member.findMany({
        include: {
            group: true,
            _count: {
                select: { attendance: { where: { isPresent: true } } }
            }
        },
        orderBy: { name: "asc" }
    })

    const groups = await db.ministryGroup.findMany()

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Members Management</h1>
                    <p className="text-muted-foreground">Manage fellowship members and track their progression.</p>
                </div>
            </div>

            <MembersClient initialMembers={members} groups={groups} />
        </div>
    )
}
