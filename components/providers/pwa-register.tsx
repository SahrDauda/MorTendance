"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.location.protocol.startsWith("http")
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("MOR Camp ServiceWorker registered with scope:", reg.scope)
        })
        .catch((err) => {
          console.warn("ServiceWorker registration error:", err)
        })
    }
  }, [])

  return null
}
