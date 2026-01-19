import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminDashboard } from "./admin-dashboard"
import { LeaderDashboard } from "./leader-dashboard"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const session = await auth()
    console.log("[Dashboard] Session:", session)

    if (!session || !session.user) {
        console.error("[Dashboard] No session or user found")
        redirect("/auth/signin")
    }

    const userRole = session.user?.role
    console.log("[Dashboard] User role:", userRole)

    if (!userRole) {
        console.error("[Dashboard] User role is missing")
        redirect("/auth/signin")
    }

    try {
        // Render role-based dashboard
        // Render role-based dashboard
        if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
            return <AdminDashboard currentUserRole={userRole} />
        }

        return <LeaderDashboard />
    } catch (error: any) {
        console.error("[Dashboard] Error:", error)
        console.error("[Dashboard] Error stack:", error?.stack)
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8">
                <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
                <p className="text-muted-foreground mb-4">
                    There was an error loading the dashboard. Please try refreshing the page.
                </p>
                {process.env.NODE_ENV === "development" && (
                    <pre className="text-xs bg-muted p-4 rounded mt-4 max-w-2xl overflow-auto">
                        {String(error)}
                        {error?.stack && `\n\nStack:\n${error.stack}`}
                    </pre>
                )}
            </div>
        )
    }
}
