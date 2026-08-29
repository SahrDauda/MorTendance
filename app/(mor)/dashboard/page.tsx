import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CampDashboard } from "./camp-dashboard"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/auth/signin")
  }

  const userRole = session.user?.role || "ADMIN"

  return <CampDashboard currentUserRole={userRole} />
}
