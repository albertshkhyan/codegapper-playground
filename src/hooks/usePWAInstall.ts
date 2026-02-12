import { useState, useEffect } from 'react'

/**
 * Captures the PWA install prompt (Chrome/Edge) and exposes install().
 * Safari does not support beforeinstallprompt; button will not show there.
 */
export function usePWAInstall() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    const eventName = 'beforeinstallprompt' as keyof WindowEventMap
    window.addEventListener(eventName, handler)

    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const standaloneApple = (navigator as Navigator & { standalone?: boolean }).standalone === true
    if (standalone || standaloneApple) {
      setIsInstalled(true)
    }

    return () => window.removeEventListener(eventName, handler)
  }, [])

  const install = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    installEvent.userChoice.then(({ outcome }) => {
      if (outcome === 'accepted') setInstallEvent(null)
    })
  }

  return { canInstall: Boolean(installEvent && !isInstalled), install }
}
