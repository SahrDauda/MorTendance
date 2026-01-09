import type React from "react"
import { Sidebar } from "@/components/shared/sidebar"
import { Header } from "@/components/shared/header"
import { MobileNav } from "@/components/shared/mobile-nav"

export default function MorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative min-h-screen bg-background">
            <Header />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 lg:pl-64 pb-24 lg:pb-0">
                    <div className="container mx-auto p-4 md:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
            <MobileNav />
        </div>
    )
}
