"use client";

import { useEffect, useState } from "react";
import {
  enterStaffFullscreen,
  exitStaffFullscreen,
  isDocumentFullscreen,
  isStaffFullscreen,
  isStaffFullscreenSupported,
} from "@/lib/staff-fullscreen";
import { isStaffStandalone } from "@/lib/staff-tablet";

/** Botão ecrã inteiro. Em PWA instalada fica oculto (já é fullscreen). */
export function StaffFullscreenToggle() {
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setSupported(isStaffFullscreenSupported());
    setStandalone(isStaffStandalone());
    setActive(isStaffFullscreen());

    const sync = () => {
      setStandalone(isStaffStandalone());
      setActive(isDocumentFullscreen() || isStaffStandalone());
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  if (!supported || standalone) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (isDocumentFullscreen()) void exitStaffFullscreen();
        else void enterStaffFullscreen();
      }}
      className="rounded-lg border border-brand-line text-brand-muted font-semibold touch-manipulation hover:text-brand-gold hover:border-brand-gold/40 text-[10px] px-2.5 py-2 min-h-[40px] uppercase tracking-wide"
      aria-label={active ? "Sair do ecrã inteiro" : "Ecrã inteiro"}
      title={active ? "Sair do ecrã inteiro" : "Ecrã inteiro"}
    >
      {active ? "Janela" : "Cheia"}
    </button>
  );
}
