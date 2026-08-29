"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Smartphone, Download, Check } from "lucide-react"
import { toast } from "sonner"

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    // Check if already in standalone / installed app mode
    if (
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true)
    ) {
      setIsStandalone(true)
    }

    // Check if iOS device
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase()
      setIsIos(/iphone|ipad|ipod/.test(userAgent))
    }

    // Capture beforeinstallprompt event for Android/Chrome/Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
    }
  }, [])

  if (isStandalone) {
    return null // Already installed and running inside app
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger native browser install prompt
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        toast.success("MOR Camp installed successfully!")
        setDeferredPrompt(null)
      }
    } else if (isIos) {
      toast.info("To install on iPhone: tap the Share button (⎋) and select 'Add to Home Screen' (⊞)", {
        duration: 5000,
      })
    } else {
      toast.info("To install: tap your browser menu (⋮) and select 'Install app' or 'Add to Home screen'", {
        duration: 5000,
      })
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstallClick}
      className="gap-1.5 h-8 px-2.5 rounded-xl border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold shadow-sm"
      title="Install MOR Camp application on your phone"
    >
      <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="hidden sm:inline">Install App</span>
      <span className="sm:hidden">Install</span>
    </Button>
  )
}
