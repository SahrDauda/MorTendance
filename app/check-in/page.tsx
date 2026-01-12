import { db } from "@/lib/db"
import { CheckInClient } from "./check-in-client"
import { EventType } from "@prisma/client"

export default async function CheckInPage({
    searchParams,
}: {
    searchParams: Promise<{ branchId?: string; type?: string }>
}) {
    const { branchId, type = "SATURDAY_FELLOWSHIP" } = await searchParams

    if (!branchId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h1 className="text-2xl font-bold text-destructive">Invalid QR Code</h1>
                <p className="text-muted-foreground">This QR code does not contain branch information.</p>
            </div>
        )
    }

    const branch = await db.branch.findUnique({
        where: { id: branchId },
        select: { name: true }
    })

    if (!branch) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h1 className="text-2xl font-bold text-destructive">Branch Not Found</h1>
                <p className="text-muted-foreground">The branch associated with this QR code no longer exists.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col items-center justify-center p-4">
            <CheckInClient
                branchId={branchId}
                branchName={branch.name}
                eventType={type as EventType}
            />
        </div>
    )
}
