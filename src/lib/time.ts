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
