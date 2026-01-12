import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { QRGeneratorClient } from "./qr-generator-client"

export default async function QRPage() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        redirect("/auth/signin")
    }

    const branches = await db.branch.findMany({
        select: {
            id: true,
            name: true
        },
        orderBy: {
            name: "asc"
        }
    })

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">QR Code Generator</h1>
                <p className="text-muted-foreground">Generate static QR codes for branch check-ins.</p>
            </div>

            <QRGeneratorClient branches={branches} />
        </div>
    )
}
