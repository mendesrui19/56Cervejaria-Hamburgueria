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

export function isStaffFullscreen(): boolean {
  const d = doc();
  if (!d) return false;
  return Boolean(d.fullscreenElement || d.webkitFullscreenElement);
}

export function isStaffFullscreenSupported(): boolean {
  if (typeof document === "undefined") return false;
  const el = document.documentElement as FullscreenElement;
  return Boolean(el.requestFullscreen || el.webkitRequestFullscreen);
}

/** Pedir ecrã inteiro (precisa de gesto do utilizador). Falha em silêncio no iOS Safari. */
export async function enterStaffFullscreen(): Promise<boolean> {
  if (isStaffFullscreen()) return true;
  const el = document.documentElement as FullscreenElement;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
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
  if (!isStaffFullscreen()) return;
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
