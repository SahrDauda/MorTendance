"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Building, Globe, Bell, Shield, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateSettingAction } from "../actions"

interface SettingsClientProps {
    initialSettings: {
        ministry_name: string
        ministry_email: string
        attendance_threshold: string
        enable_notifications: string
        allow_self_checkin: string
    }
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
    const [settings, setSettings] = useState(initialSettings)
    const [isSaving, setIsSaving] = useState<string | null>(null)

    const handleUpdate = async (key: string, value: string) => {
        setIsSaving(key)
        try {
            const result = await updateSettingAction(key, value)
            if (result.success) {
                setSettings(prev => ({ ...prev, [key]: value }))
                toast.success(`Setting updated: ${key.replace("_", " ")}`)
            } else {
                toast.error(result.error || "Failed to update setting")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSaving(null)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" />
                        <CardTitle>Organization Details</CardTitle>
                    </div>
                    <CardDescription>Basic information about your ministry.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Ministry Name</Label>
                        <div className="flex gap-2">
                            <Input
                                value={settings.ministry_name}
                                onChange={(e) => setSettings(prev => ({ ...prev, ministry_name: e.target.value }))}
                            />
                            <Button
                                size="sm"
                                onClick={() => handleUpdate("ministry_name", settings.ministry_name)}
                                disabled={isSaving === "ministry_name"}
                            >
                                {isSaving === "ministry_name" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Contact Email</Label>
                        <div className="flex gap-2">
                            <Input
                                value={settings.ministry_email}
                                onChange={(e) => setSettings(prev => ({ ...prev, ministry_email: e.target.value }))}
                            />
                            <Button
                                size="sm"
                                onClick={() => handleUpdate("ministry_email", settings.ministry_email)}
                                disabled={isSaving === "ministry_email"}
                            >
                                {isSaving === "ministry_email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        <CardTitle>System Preferences</CardTitle>
                    </div>
                    <CardDescription>Global behavior and thresholds.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Attendance Threshold (%)</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                value={settings.attendance_threshold}
                                onChange={(e) => setSettings(prev => ({ ...prev, attendance_threshold: e.target.value }))}
                            />
                            <Button
                                size="sm"
                                onClick={() => handleUpdate("attendance_threshold", settings.attendance_threshold)}
                                disabled={isSaving === "attendance_threshold"}
                            >
                                {isSaving === "attendance_threshold" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Minimum attendance percentage for "Established" status.</p>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                        <div className="space-y-0.5">
                            <Label>Enable Notifications</Label>
                            <p className="text-[10px] text-muted-foreground">Send automated alerts to leaders.</p>
                        </div>
                        <Switch
                            checked={settings.enable_notifications === "true"}
                            onCheckedChange={(checked) => handleUpdate("enable_notifications", checked.toString())}
                            disabled={isSaving === "enable_notifications"}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                        <div className="space-y-0.5">
                            <Label>Allow Self Check-in</Label>
                            <p className="text-[10px] text-muted-foreground">Enable members to check-in via QR code.</p>
                        </div>
                        <Switch
                            checked={settings.allow_self_checkin === "true"}
                            onCheckedChange={(checked) => handleUpdate("allow_self_checkin", checked.toString())}
                            disabled={isSaving === "allow_self_checkin"}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
