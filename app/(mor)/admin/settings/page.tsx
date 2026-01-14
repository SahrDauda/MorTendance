import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Settings, Building, Globe, Bell, Shield, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SettingsClient } from "./settings-client"

export const dynamic = 'force-dynamic'

export default async function MinistrySettingsPage() {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") redirect("/dashboard")

    const settings = await db.systemSetting.findMany()

    // Default settings if not in DB
    const defaultSettings = {
        ministry_name: "MOR Attendance",
        ministry_email: "contact@mor.org",
        attendance_threshold: "75",
        enable_notifications: "true",
        allow_self_checkin: "false",
    }

    const mergedSettings = { ...defaultSettings }
    settings.forEach(s => {
        mergedSettings[s.key as keyof typeof defaultSettings] = s.value
    })

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Settings className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Ministry Settings</h1>
                        <p className="text-muted-foreground">Configure global ministry parameters and system preferences.</p>
                    </div>
                </div>
            </div>

            <SettingsClient initialSettings={mergedSettings} />
        </div>
    )
}
