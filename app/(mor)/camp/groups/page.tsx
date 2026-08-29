import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CampGroupsClient } from "./camp-groups-client"

export const dynamic = "force-dynamic"

export default async function CampGroupsPage() {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  return <CampGroupsClient userRole={session.user?.role || "ADMIN"} />
}
