import { db } from "@/lib/db"
import { NewcomerRegistrationClient } from "./newcomer-registration-client"
import { EventType } from "@prisma/client"

export default async function NewcomerRegistrationPage({
    searchParams,
}: {
    searchParams: Promise<{ branchId?: string; type?: string }>
}) {
    const { branchId, type = "SATURDAY_FELLOWSHIP" } = await searchParams

    const [groups, branches] = await Promise.all([
        db.ministryGroup.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" }
        }),
        db.branch.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" }
        })
    ])

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col items-center justify-center p-4 py-12">
            <NewcomerRegistrationClient
                groups={groups}
                branches={branches}
                initialBranchId={branchId}
                initialType={type as EventType}
            />
        </div>
    )
}
