import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/shared/logo"
import {
    Users,
    ClipboardCheck,
    BarChart3,
    ShieldCheck,
    ArrowRight,
    CheckCircle2
} from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function RootPage() {
    const session = await auth()

    // If authenticated, redirect to dashboard
    if (session) {
        redirect("/dashboard")
    }

    // Show landing page for unauthenticated users
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-slate-50/50 dark:via-slate-950/50 to-primary/5 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="relative z-10 container mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                    <Logo variant="full" size="lg" />
                    <Link href="/auth/signin">
                        <Button variant="outline" className="rounded-full">
                            Sign In
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <main className="relative z-10 container mx-auto px-4 py-12 md:py-24">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                            MorTendance
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                            Track attendance, manage members, and grow your ministry fellowship with ease
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/auth/signin">
                            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <div className="p-3 rounded-xl bg-blue-500/10 w-fit mb-2">
                                <ClipboardCheck className="h-6 w-6 text-blue-500" />
                            </div>
                            <CardTitle>Attendance Tracking</CardTitle>
                            <CardDescription>
                                Easily mark and track attendance for all your fellowship groups
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <div className="p-3 rounded-xl bg-green-500/10 w-fit mb-2">
                                <Users className="h-6 w-6 text-green-500" />
                            </div>
                            <CardTitle>Member Management</CardTitle>
                            <CardDescription>
                                Add, view, and manage member information across all groups
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <div className="p-3 rounded-xl bg-purple-500/10 w-fit mb-2">
                                <BarChart3 className="h-6 w-6 text-purple-500" />
                            </div>
                            <CardTitle>Reports & Analytics</CardTitle>
                            <CardDescription>
                                Generate comprehensive reports and export data in multiple formats
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <div className="p-3 rounded-xl bg-amber-500/10 w-fit mb-2">
                                <ShieldCheck className="h-6 w-6 text-amber-500" />
                            </div>
                            <CardTitle>Role-Based Access</CardTitle>
                            <CardDescription>
                                Secure access control with Admin and Leader roles
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <div className="p-3 rounded-xl bg-emerald-500/10 w-fit mb-2">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            </div>
                            <CardTitle>Member Status Tracking</CardTitle>
                            <CardDescription>
                                Track member progression from Preliminary to Established status
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <div className="p-3 rounded-xl bg-rose-500/10 w-fit mb-2">
                                <BarChart3 className="h-6 w-6 text-rose-500" />
                            </div>
                            <CardTitle>Data Export</CardTitle>
                            <CardDescription>
                                Export attendance and member data as PDF, CSV, or Excel files
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                {/* CTA Section */}
                <div className="mt-24 text-center space-y-6">
                    <h2 className="text-3xl md:text-4xl font-bold">Ready to get started?</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Sign in to your account or contact your administrator to get access
                    </p>
                    <Link href="/auth/signin">
                        <Button size="lg" variant="default" className="rounded-full px-8">
                            Sign In to Dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-border/50 mt-24">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Logo variant="icon" size="sm" />
                            <span className="text-sm text-muted-foreground">
                                Ministry of Reconciliation Attendance System
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} MorTendance. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
