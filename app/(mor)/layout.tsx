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
    <div className="relative min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Header />
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <main className="flex-1 w-full max-w-full lg:pl-64 pb-20 lg:pb-8 min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
