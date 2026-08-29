import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SessionProvider } from "@/components/providers/session-provider"
import { PwaRegister } from "@/components/providers/pwa-register"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "MOR Camp 2026",
    template: "%s | MOR Camp",
  },
  description:
    "Ministry of Reconciliation (MOR) Camp Attendance & Check-In System",
  keywords: ["ministry", "attendance", "camp", "MOR", "check-in", "reconciliation"],
  authors: [{ name: "MOR Team" }],
  creator: "MOR",
  generator: "MOR System",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MOR Camp",
  },
  formatDetection: {
    telephone: true,
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "MOR Camp",
    title: "MOR Camp Attendance System",
    description: "Ministry of Reconciliation (MOR) Camp Attendance & Check-In System",
  },
  twitter: {
    card: "summary",
    title: "MOR Camp Attendance System",
    description: "Ministry of Reconciliation (MOR) Camp Attendance & Check-In System",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0F172A" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="touch-manipulation">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-background selection:bg-primary/20 overflow-x-hidden`}>
        <SessionProvider>
          <PwaRegister />
          {children}
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
