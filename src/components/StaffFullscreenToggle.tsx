"use client";

import { useEffect, useState } from "react";
import {
  enterStaffFullscreen,
  exitStaffFullscreen,
  isStaffFullscreen,
  isStaffFullscreenSupported,
} from "@/lib/staff-fullscreen";

/** Botão para entrar/sair do ecrã inteiro (fallback se não abriu pelo hub). */
export function StaffFullscreenToggle() {
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isStaffFullscreenSupported());
    setActive(isStaffFullscreen());

    const sync = () => setActive(isStaffFullscreen());
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (active) void exitStaffFullscreen();
        else void enterStaffFullscreen();
      }}
      className="rounded-lg border border-brand-line text-brand-muted font-semibold touch-manipulation hover:text-brand-gold hover:border-brand-gold/40 text-[10px] px-2 py-1.5 uppercase tracking-wide"
      aria-label={active ? "Sair do ecrã inteiro" : "Ecrã inteiro"}
      title={active ? "Sair do ecrã inteiro" : "Ecrã inteiro"}
    >
      {active ? "Janela" : "Cheia"}
    </button>
  );
}
