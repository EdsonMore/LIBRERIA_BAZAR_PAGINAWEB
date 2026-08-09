"use client"

import { useEffect } from "react"

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js")
        // La app controla la primera petición una vez que toma el control.
        if (reg.waiting) {
          // Forzar activación en actualizaciones para que la versión nueva reaccione.
          reg.waiting.postMessage({ type: "SKIP_WAITING" })
        }
      } catch (error) {
        console.error("[SW] Error al registrar service worker:", error)
      }
    }
    void register()
  }, [])

  return null
}