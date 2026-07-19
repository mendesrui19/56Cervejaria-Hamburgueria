import { isStaffStandalone } from "@/lib/staff-tablet";

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function doc(): FullscreenDocument | null {
  if (typeof document === "undefined") return null;
  return document as FullscreenDocument;
}

/** API Fullscreen activa (Chrome). */
export function isDocumentFullscreen(): boolean {
  const d = doc();
  if (!d) return false;
  return Boolean(d.fullscreenElement || d.webkitFullscreenElement);
}

/** Ecrã “cheio” para o staff: PWA instalada ou Fullscreen API. */
export function isStaffFullscreen(): boolean {
  return isDocumentFullscreen() || isStaffStandalone();
}

export function isStaffFullscreenSupported(): boolean {
  if (typeof document === "undefined") return false;
  if (isStaffStandalone()) return true;
  const el = document.documentElement as FullscreenElement;
  return Boolean(el.requestFullscreen || el.webkitRequestFullscreen);
}

/** Pedir ecrã inteiro (precisa de gesto do utilizador). */
export async function enterStaffFullscreen(): Promise<boolean> {
  if (isStaffStandalone() || isDocumentFullscreen()) return true;
  const el = document.documentElement as FullscreenElement;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen(
        { navigationUI: "hide" } as FullscreenOptions
      );
      return true;
    }
    if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return true;
    }
  } catch {
    /* utilizador recusou ou browser não permite */
  }
  return false;
}

export async function exitStaffFullscreen(): Promise<void> {
  /* PWA instalada não sai com exitFullscreen — só Chrome fullscreen */
  if (!isDocumentFullscreen()) return;
  const d = doc();
  if (!d) return;
  try {
    if (d.exitFullscreen) {
      await d.exitFullscreen();
      return;
    }
    if (d.webkitExitFullscreen) {
      await d.webkitExitFullscreen();
    }
  } catch {
    /* ignore */
  }
}
