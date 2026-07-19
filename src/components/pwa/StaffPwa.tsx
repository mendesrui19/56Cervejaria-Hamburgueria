"use client";

import { useCallback, useEffect, useState } from "react";
import type { StaffPwaConfig } from "@/lib/pwa";
import { isAndroidDevice, isStaffStandalone } from "@/lib/staff-tablet";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = (id: string) => `pwa-install-dismiss-${id}`;

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
  const [mounted, setMounted] = useState(false);
  const [android, setAndroid] = useState(false);

  useEffect(() => {
    setMounted(true);
    setInstalled(isStaffStandalone());
    setAndroid(isAndroidDevice());
    setDismissed(Boolean(localStorage.getItem(DISMISS_KEY(app.id))));

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" });
    }

    const onInstallable = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
      localStorage.removeItem(DISMISS_KEY(app.id));
    };

    window.addEventListener("beforeinstallprompt", onInstallable);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallable);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [app.id]);

  const dismissBanner = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY(app.id), "1");
  }, [app.id]);

  const handleInstall = useCallback(async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setInstallEvent(null);
  }, [installEvent]);

  const showInstallBanner =
    mounted &&
    Boolean(installEvent) &&
    !installed &&
    !dismissed;

  return (
    <>
      {showInstallBanner ? (
        <div className="fixed bottom-3 inset-x-3 z-[60] sm:bottom-4 sm:inset-x-auto sm:right-4 sm:max-w-sm">
          <div className="rounded-2xl border border-brand-gold/30 bg-white shadow-xl px-4 py-3.5">
            <p className="text-sm font-bold text-brand-gold">
              Instalar {app.shortName} no tablet
            </p>
            <p className="text-xs text-brand-muted mt-1 leading-snug">
              {android
                ? "Abre em ecrã inteiro, sem barra do Chrome — ideal para o serviço."
                : "Adiciona ao ecrã inicial para usar como app."}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => void handleInstall()}
                className="flex-1 min-h-[44px] rounded-xl bg-brand-gold text-white text-sm font-bold touch-manipulation"
              >
                Instalar
              </button>
              <button
                type="button"
                onClick={dismissBanner}
                className="min-h-[44px] px-3 rounded-xl border border-brand-line text-xs font-semibold text-brand-muted touch-manipulation"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {children}
    </>
  );
}
