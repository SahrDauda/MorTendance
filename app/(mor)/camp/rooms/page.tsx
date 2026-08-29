import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CampRoomsClient } from "./camp-rooms-client"

export const dynamic = "force-dynamic"

export default async function CampRoomsPage() {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  return <CampRoomsClient userRole={session.user?.role || "ADMIN"} />
}
