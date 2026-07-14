"use client";

import { useCallback, useEffect, useState } from "react";
import type { StaffPwaConfig } from "@/lib/pwa";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function StaffPwa({
  app,
  children,
}: {
  app: StaffPwaConfig;
  children: React.ReactNode;
}) {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setInstalled(isStandalone());

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" });
    }

    let iosTimer: number | undefined;
    if (!isStandalone() && isIos()) {
      const key = `pwa-ios-hint-${app.id}`;
      if (!localStorage.getItem(key)) {
        iosTimer = window.setTimeout(() => setShowIosHint(true), 1200);
      }
    }

    const onInstallable = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
      setShowIosHint(false);
    };

    window.addEventListener("beforeinstallprompt", onInstallable);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      if (iosTimer) window.clearTimeout(iosTimer);
      window.removeEventListener("beforeinstallprompt", onInstallable);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [app.id]);

  const dismissBanner = useCallback(() => {
    setDismissed(true);
    setShowIosHint(false);
    if (isIos()) {
      localStorage.setItem(`pwa-ios-hint-${app.id}`, "1");
    }
  }, [app.id]);

  const handleInstall = useCallback(async () => {
    if (!installEvent) {
      if (isIos() && !installed) setShowIosHint(true);
      return;
    }

    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setInstallEvent(null);
  }, [installEvent, installed]);

  const showAndroidBanner =
    mounted && Boolean(installEvent) && !installed && !dismissed;
  const showIosBanner =
    mounted &&
    (showIosHint || (isIos() && !installed && !dismissed && !installEvent)) &&
    !dismissed;

  return (
    <>
      {showAndroidBanner && (
        <div className="sticky top-0 z-50 border-b border-brand-gold/20 bg-amber-50 px-3 py-2.5">
          <div className="flex items-center gap-2 max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm text-stone-800 flex-1 min-w-0">
              Instalar <span className="font-bold">{app.shortName}</span> no
              telemóvel ou tablet
            </p>
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="shrink-0 rounded-lg bg-brand-gold px-3 py-1.5 text-xs font-bold text-white"
            >
              Instalar
            </button>
            <button
              type="button"
              onClick={dismissBanner}
              className="shrink-0 text-xs font-semibold text-brand-muted px-1"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showIosBanner && !showAndroidBanner && (
        <div className="sticky top-0 z-50 border-b border-brand-gold/20 bg-amber-50 px-3 py-2.5">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm text-stone-800">
              <span className="font-bold">{app.shortName} no iPhone/iPad:</span>{" "}
              Safari → Partilhar →{" "}
              <span className="font-semibold">Adicionar ao Ecrã Principal</span>
            </p>
            <button
              type="button"
              onClick={dismissBanner}
              className="text-[11px] font-semibold text-brand-muted mt-1"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
