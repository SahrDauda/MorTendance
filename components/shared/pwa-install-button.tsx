"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, Share, PlusSquare, Smartphone, Check } from "lucide-react"

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [iosModalOpen, setIosModalOpen] = useState(false)

  useEffect(() => {
    // Check if already in standalone / installed mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true)
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIos(isIosDevice)

    // Capture beforeinstallprompt for Android/Chrome
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
    return null // Already installed and running as an app!
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setDeferredPrompt(null)
      }
    } else if (isIos) {
      setIosModalOpen(true)
    } else {
      // Fallback instructions
      setIosModalOpen(true)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleInstallClick}
        className="gap-1.5 h-8 px-2.5 rounded-xl border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </Button>

      {/* iOS / General Install Instructions Modal */}
      <Dialog open={iosModalOpen} onOpenChange={setIosModalOpen}>
        <DialogContent className="max-w-sm bg-card p-5 rounded-2xl">
          <DialogHeader className="text-left space-y-2">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl w-fit">
              <Smartphone className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-black text-foreground">
              Install MOR Camp on your Phone
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Install this app directly onto your home screen for fast, full-screen offline and on-site use.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-foreground font-medium">
            {isIos ? (
              <div className="space-y-2.5 bg-muted/40 p-3.5 rounded-xl border">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> icon (
                    <Share className="w-3.5 h-3.5 inline text-primary mx-0.5" />
                    ) in Safari.
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <span>
                    Scroll down and tap{" "}
                    <strong>
                      Add to Home Screen{" "}
                      <PlusSquare className="w-3.5 h-3.5 inline text-primary mx-0.5" />
                    </strong>
                    .
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    3
                  </span>
                  <span>
                    Tap <strong>Add</strong> in the top right.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 bg-muted/40 p-3.5 rounded-xl border">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <span>Tap the three dots browser menu (⋮).</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <span>
                    Select <strong>Install App</strong> or <strong>Add to Home Screen</strong>.
                  </span>
                </div>
              </div>
            )}
          </div>

          <Button
            className="w-full bg-primary text-white font-bold h-10 rounded-xl"
            onClick={() => setIosModalOpen(false)}
          >
            Got It
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
