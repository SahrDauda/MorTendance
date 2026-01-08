import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MembersClient } from "./members-client"

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
    const session = await auth()
    if (!session) redirect("/auth/signin")

    console.log("[MembersPage] Using mock data")

    // Mock groups
    const groups = [
        { id: "group-1", name: "Huiothesia" },
        { id: "group-2", name: "Doxasmus" }
    ]

    // Mock members
    const members = [
        {
            id: "m1",
            name: "Mock Member 1",
            phoneNumber: "123-456-7890",
            status: "ESTABLISHED",
            groupId: "group-1",
            group: { id: "group-1", name: "Huiothesia" },
            _count: { attendance: 15 }
        },
        {
            id: "m2",
            name: "Mock Member 2",
            phoneNumber: "098-765-4321",
            status: "PRELIMINARY",
            groupId: "group-2",
            group: { id: "group-2", name: "Doxasmus" },
            _count: { attendance: 3 }
        }
    ]

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
                groups={groups as any}
                userRole={session.user.role as "ADMIN" | "LEADER" | "COORDINATOR"}
            />
        </div>
    )
}
