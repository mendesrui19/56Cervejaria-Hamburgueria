/** Detecção e helpers para tablets Android (Chrome / PWA staff). */

export function isStaffStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    nav.standalone === true
  );
}

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/** Tablet / ecrã grande táctil — típico POS Android. */
export function isStaffTabletDevice(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = isCoarsePointer();
  const wide = window.matchMedia("(min-width: 768px)").matches;
  const ua = navigator.userAgent || "";
  const android = /Android/i.test(ua);
  return (coarse && wide) || (android && wide);
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
}
