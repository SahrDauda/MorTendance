import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminDashboard } from "./admin-dashboard"
import { LeaderDashboard } from "./leader-dashboard"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const session = await auth()
    if (!session) redirect("/auth/signin")

    // Render role-based dashboard
    if (session.user.role === "ADMIN") {
        return <AdminDashboard />
    }

    return <LeaderDashboard />
}
