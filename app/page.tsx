import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function RootPage() {
    // The middleware handles authentication. 
    // If we reach here, the user is authenticated.
    redirect("/dashboard")
}
