import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import CampAnalysisClient from "./camp-analysis-client"

export const dynamic = "force-dynamic"

export default async function CampAnalysisPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/auth/signin")
  }

  const userRole = session.user?.role || "ADMIN"

  return <CampAnalysisClient userRole={userRole} />
}
