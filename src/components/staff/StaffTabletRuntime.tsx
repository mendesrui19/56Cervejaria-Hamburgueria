"use client";

import { useEffect } from "react";
import {
  isAndroidDevice,
  isStaffStandalone,
  isStaffTabletDevice,
} from "@/lib/staff-tablet";
import { enterStaffFullscreen } from "@/lib/staff-fullscreen";

/**
 * Runtime tablet Android: classes CSS, ecrã ligado (Wake Lock),
 * desbloqueio de áudio, ecrã inteiro ao primeiro toque se não for PWA.
 */
export function StaffTabletRuntime() {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const syncClasses = () => {
      root.classList.toggle("staff-tablet", isStaffTabletDevice());
      root.classList.toggle("staff-android", isAndroidDevice());
      root.classList.toggle("staff-standalone", isStaffStandalone());
    };

    syncClasses();
    window.addEventListener("resize", syncClasses);

    body.classList.add("staff-pos-body");

    /* Mantém o ecrã ligado durante o serviço */
    let wakeLock: WakeLockSentinel | null = null;
    let wakeSupported = false;

    const requestWake = async () => {
      try {
        if (!("wakeLock" in navigator)) return;
        wakeSupported = true;
        if (document.visibilityState !== "visible") return;
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => {
          wakeLock = null;
        });
      } catch {
        /* browser / permissão */
      }
    };

    void requestWake();

    const onVisibility = () => {
      if (document.visibilityState === "visible" && wakeSupported) {
        void requestWake();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    /* Desbloqueia WebAudio no primeiro gesto (sons de prontos/alertas) */
    const unlockAudio = () => {
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        void ctx.resume().finally(() => {
          void ctx.close();
        });
      } catch {
        /* ignore */
      }
      document.removeEventListener("pointerdown", unlockAudio, true);
    };
    document.addEventListener("pointerdown", unlockAudio, true);

    /* Se abriu no Chrome (não PWA), 1.º toque → ecrã inteiro */
    const ensureFullscreen = () => {
      if (isStaffStandalone()) return;
      void enterStaffFullscreen();
      document.removeEventListener("pointerdown", ensureFullscreen, true);
    };
    if (!isStaffStandalone()) {
      document.addEventListener("pointerdown", ensureFullscreen, true);
    }

    return () => {
      window.removeEventListener("resize", syncClasses);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("pointerdown", unlockAudio, true);
      document.removeEventListener("pointerdown", ensureFullscreen, true);
      body.classList.remove("staff-pos-body");
      root.classList.remove("staff-tablet", "staff-android", "staff-standalone");
      void wakeLock?.release();
    };
  }, []);

  return null;
}
