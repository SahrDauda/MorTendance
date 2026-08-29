import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PrintTagsClient } from "./print-tags-client"

export const dynamic = "force-dynamic"

export default async function PrintTagsPage() {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  return <PrintTagsClient />
}
