import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function RootPage() {
    const session = await auth()

    // If authenticated, redirect to dashboard
    if (session) {
        redirect("/dashboard")
    }

    // If not authenticated, redirect to login
    redirect("/auth/signin")
}
