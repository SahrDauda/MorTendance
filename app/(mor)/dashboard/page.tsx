import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminDashboard } from "./admin-dashboard"
import { LeaderDashboard } from "./leader-dashboard"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    try {
        const session = await auth()
        if (!session) redirect("/auth/signin")

        // Render role-based dashboard
        if (session.user.role === "ADMIN") {
            return <AdminDashboard />
        }

        return <LeaderDashboard />
    } catch (error) {
        console.error("Dashboard error:", error)
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8">
                <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
                <p className="text-muted-foreground mb-4">
                    There was an error loading the dashboard. Please try refreshing the page.
                </p>
                {process.env.NODE_ENV === "development" && (
                    <pre className="text-xs bg-muted p-4 rounded mt-4 max-w-2xl overflow-auto">
                        {String(error)}
                    </pre>
                )}
            </div>
        )
    }
}
