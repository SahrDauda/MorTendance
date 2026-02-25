import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { QRGeneratorClient } from "./qr-generator-client"

export default async function QRPage() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        redirect("/auth/signin")
    }

    const [branches, groups] = await Promise.all([
        db.branch.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" }
        }),
        db.ministryGroup.findMany({
            select: { id: true, name: true, branchId: true },
            orderBy: { name: "asc" }
        })
    ])

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Saturday Fellowship QR</h1>
                <p className="text-muted-foreground">
                    Generate a simple QR code for Saturday Fellowship self check-in, per branch.
                </p>
            </div>

            <QRGeneratorClient branches={branches} groups={groups} />
        </div>
    )
}
