import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CampAttendanceClient } from "./camp-attendance-client"

export const dynamic = "force-dynamic"

export default async function CampAttendancePage() {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  return <CampAttendanceClient />
}
