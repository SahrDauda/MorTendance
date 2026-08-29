import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CampMembersClient } from "./camp-members-client"

export const dynamic = "force-dynamic"

export default async function CampMembersPage() {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  return <CampMembersClient userRole={session.user?.role || "ADMIN"} />
}
