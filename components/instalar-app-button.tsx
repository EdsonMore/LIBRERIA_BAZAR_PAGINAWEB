"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstalarAppButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [instalado, setInstalado] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Si ya está instalada como PWA (display-mode standalone) no mostramos el botón.
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true
    ) {
      setInstalado(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    const onInstalled = () => {
      setInstalado(true);
      setShow(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalado(true);
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  if (instalado || !show) return null;

  return (
    <button
      onClick={handleInstall}
      title="Instalar como aplicación"
      className="flex items-center gap-1.5 rounded-md border border-[#E91E63] px-2.5 py-1.5 text-[#E91E63] text-xs font-medium transition-colors hover:bg-[#E91E63] hover:text-white"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Instalar app</span>
    </button>
  );
}