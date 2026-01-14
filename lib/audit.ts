import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function logAction(action: string, entity: string, entityId?: string, details?: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return

        await db.auditLog.create({
            data: {
                userId: session.user.id,
                action,
                entity,
                entityId,
                details
            }
        })
    } catch (error) {
        console.error("Failed to log action:", error)
    }
}
