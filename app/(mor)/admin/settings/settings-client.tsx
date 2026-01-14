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
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async (key: string, value: string) => {
        setIsSaving(true)
        try {
            const result = await updateSettingAction(key, value)
            if (result.success) {
                toast.success(`Setting updated: ${key.replace("_", " ")}`)
            } else {
                toast.error("Failed to update setting")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* General Settings */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-primary" />
                            <CardTitle>General Information</CardTitle>
                        </div>
                        <CardDescription>Basic ministry identification details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Ministry Name</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={settings.ministry_name}
                                    onChange={(e) => setSettings({ ...settings, ministry_name: e.target.value })}
                                />
                                <Button size="icon" variant="outline" onClick={() => handleSave("ministry_name", settings.ministry_name)}>
                                    <Save className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Email</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={settings.ministry_email}
                                    onChange={(e) => setSettings({ ...settings, ministry_email: e.target.value })}
                                />
                                <Button size="icon" variant="outline" onClick={() => handleSave("ministry_email", settings.ministry_email)}>
                                    <Save className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* System Preferences */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <CardTitle>System Preferences</CardTitle>
                        </div>
                        <CardDescription>Control how the system behaves.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable Notifications</Label>
                                <p className="text-xs text-muted-foreground">Send automated alerts to leaders.</p>
                            </div>
                            <Switch
                                checked={settings.enable_notifications === "true"}
                                onCheckedChange={(checked) => {
                                    const val = checked.toString()
                                    setSettings({ ...settings, enable_notifications: val })
                                    handleSave("enable_notifications", val)
                                }}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Allow Self Check-in</Label>
                                <p className="text-xs text-muted-foreground">Members can mark their own attendance via QR.</p>
                            </div>
                            <Switch
                                checked={settings.allow_self_checkin === "true"}
                                onCheckedChange={(checked) => {
                                    const val = checked.toString()
                                    setSettings({ ...settings, allow_self_checkin: val })
                                    handleSave("allow_self_checkin", val)
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Attendance Threshold (%)</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={settings.attendance_threshold}
                                    onChange={(e) => setSettings({ ...settings, attendance_threshold: e.target.value })}
                                />
                                <Button size="icon" variant="outline" onClick={() => handleSave("attendance_threshold", settings.attendance_threshold)}>
                                    <Save className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
