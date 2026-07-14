export function minutesSince(isoDate?: string): number | null {
  if (!isoDate) return null;
  const then = new Date(isoDate).getTime();
  if (!Number.isFinite(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / 60_000));
}

export function formatWaitTime(isoDate?: string): string | null {
  const minutes = minutesSince(isoDate);
  if (minutes === null) return null;
  if (minutes < 1) return "agora";
  if (minutes === 1) return "há 1 min";
  return `há ${minutes} min`;
}

export type WaitTimeLevel = "ok" | "warn" | "urgent";

export function getWaitTimeLevel(isoDate?: string): WaitTimeLevel | null {
  const minutes = minutesSince(isoDate);
  if (minutes === null) return null;
  if (minutes < 10) return "ok";
  if (minutes < 20) return "warn";
  return "urgent";
}

export const WAIT_TIME_BADGE: Record<
  WaitTimeLevel,
  { text: string; className: string }
> = {
  ok: {
    text: "",
    className: "text-emerald-800 bg-emerald-50 border-emerald-300",
  },
  warn: {
    text: "",
    className: "text-amber-900 bg-amber-100 border-amber-400",
  },
  urgent: {
    text: "",
    className: "text-red-900 bg-red-100 border-red-400",
  },
};
