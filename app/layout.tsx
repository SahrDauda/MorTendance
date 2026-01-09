import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SessionProvider } from "@/components/providers/session-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "MOR",
    template: "%s | MOR",
  },
  description:
    "Ministry of Reconciliation (MOR) Attendance System - Tracking growth, consistency, and discipleship.",
  keywords: ["ministry", "attendance", "growth", "discipleship", "fellowship", "MOR"],
  authors: [{ name: "MOR Team" }],
  creator: "MOR",
  generator: "MOR System",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "MOR",
    title: "MOR - Tracking Ministry Growth",
    description: "Ministry of Reconciliation (MOR) Attendance System - Tracking growth, consistency, and discipleship.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MOR - Tracking Ministry Growth",
    description: "Ministry of Reconciliation (MOR) Attendance System - Tracking growth, consistency, and discipleship.",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1f2e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <SessionProvider>
          {children}
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
