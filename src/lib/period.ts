import type { AnalyticsPeriod } from "./types";

export interface PeriodSelection {
  period: AnalyticsPeriod;
  date: string;
}

/** Dia de serviço começa às 04:00 (igual à sessão staff). */
export function getServiceDayStart(reference = new Date()): Date {
  const start = new Date(reference);
  if (start.getHours() < 4) {
    start.setDate(start.getDate() - 1);
  }
  start.setHours(4, 0, 0, 0);
  return start;
}

export function toDateParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateParam(date: string | null | undefined): Date {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date();
  }
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(d: Date): boolean {
  return isSameCalendarDay(d, new Date());
}

function isCurrentMonth(d: Date): boolean {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function getPeriodRange(
  period: AnalyticsPeriod,
  reference = new Date()
): { start: Date; end: Date } {
  const now = new Date();
  const ref = new Date(reference);

  if (period === "day") {
    const start = getServiceDayStart(ref);
    const end = isToday(ref)
      ? now
      : new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
  }

  if (period === "week") {
    const anchorStart = getServiceDayStart(ref);
    const start = new Date(anchorStart);
    start.setDate(start.getDate() - 6);
    const end = isToday(ref)
      ? now
      : new Date(anchorStart.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
  }

  const start = new Date(ref.getFullYear(), ref.getMonth(), 1, 4, 0, 0, 0);
  const nextMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 1, 4, 0, 0, 0);
  const end = isCurrentMonth(ref) ? now : nextMonth;
  return { start, end };
}

export function getCalendarHighlight(
  period: AnalyticsPeriod,
  anchor: Date
): Set<string> {
  const result = new Set<string>();

  if (period === "day") {
    result.add(toDateParam(anchor));
    return result;
  }

  if (period === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(d.getDate() - i);
      result.add(toDateParam(d));
    }
    return result;
  }

  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    result.add(toDateParam(new Date(year, month, d)));
  }
  return result;
}

export function formatPeriodLabel(
  period: AnalyticsPeriod,
  reference = new Date()
): string {
  const { start, end } = getPeriodRange(period, reference);
  const dateFmt = (d: Date) =>
    d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
  const monthFmt = (d: Date) =>
    d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  const timeFmt = (d: Date) =>
    d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  const ref = new Date(reference);

  if (period === "day") {
    if (isToday(ref)) {
      return `Hoje · desde ${timeFmt(start)} (${dateFmt(start)})`;
    }
    return `${dateFmt(ref)} · dia de serviço (04:00–04:00)`;
  }

  if (period === "week") {
    const anchor = parseDateParam(toDateParam(ref));
    const weekStart = new Date(anchor);
    weekStart.setDate(weekStart.getDate() - 6);
    return `Semana · ${dateFmt(weekStart)} — ${dateFmt(anchor)}`;
  }

  return `Mês · ${monthFmt(ref)}`;
}

export function formatPeriodShort(
  period: AnalyticsPeriod,
  reference = new Date()
): string {
  const ref = new Date(reference);

  if (period === "day") {
    if (isToday(ref)) return "Hoje";
    return ref.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (period === "week") {
    const anchor = parseDateParam(toDateParam(ref));
    const weekStart = new Date(anchor);
    weekStart.setDate(weekStart.getDate() - 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
    return `${fmt(weekStart)} – ${fmt(anchor)}`;
  }

  return ref.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
}

export function getPreviousPeriodReference(
  period: AnalyticsPeriod,
  reference = new Date()
): Date {
  const ref = parseDateParam(toDateParam(reference));

  if (period === "day") {
    ref.setDate(ref.getDate() - 1);
    return ref;
  }

  if (period === "week") {
    ref.setDate(ref.getDate() - 7);
    return ref;
  }

  return new Date(ref.getFullYear(), ref.getMonth() - 1, 15);
}

export function getPreviousPeriodLabel(
  period: AnalyticsPeriod,
  reference = new Date()
): string {
  return formatPeriodLabel(period, getPreviousPeriodReference(period, reference));
}

/** Rótulo curto para badges de comparação. */
export function getPreviousPeriodShortLabel(period: AnalyticsPeriod): string {
  if (period === "day") return "ontem";
  if (period === "week") return "semana anterior";
  return "mês anterior";
}

/** Avança/recua o âncora do período (dia / semana / mês). */
export function shiftAnchorDate(
  period: AnalyticsPeriod,
  anchorDate: string,
  delta: number
): string {
  const ref = parseDateParam(anchorDate);

  if (period === "day" || period === "week") {
    ref.setDate(ref.getDate() + delta * (period === "week" ? 7 : 1));
    return toDateParam(ref);
  }

  const shifted = new Date(ref.getFullYear(), ref.getMonth() + delta, 1);
  const today = new Date();
  if (
    shifted.getFullYear() > today.getFullYear() ||
    (shifted.getFullYear() === today.getFullYear() &&
      shifted.getMonth() > today.getMonth())
  ) {
    return toDateParam(today);
  }
  // Âncora no meio do mês (ou hoje se for o mês corrente)
  if (
    shifted.getFullYear() === today.getFullYear() &&
    shifted.getMonth() === today.getMonth()
  ) {
    return toDateParam(today);
  }
  return toDateParam(new Date(shifted.getFullYear(), shifted.getMonth(), 15));
}

export function canShiftAnchorForward(
  period: AnalyticsPeriod,
  anchorDate: string
): boolean {
  const today = toDateParam(new Date());
  if (anchorDate >= today) return false;
  const next = shiftAnchorDate(period, anchorDate, 1);
  return next !== anchorDate && next <= today;
}

/** Dias de serviço já decorridos no período (para média/dia). */
export function countElapsedDaysInPeriod(
  period: AnalyticsPeriod,
  reference = new Date()
): number {
  const { start, end } = getPeriodRange(period, reference);
  const ms = Math.max(0, end.getTime() - start.getTime());
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  return Math.max(1, days);
}

export const PERIOD_OPTIONS: { id: AnalyticsPeriod; label: string }[] = [
  { id: "day", label: "Dia" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mês" },
];

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

export function isFutureDate(d: Date): boolean {
  const check = new Date(d);
  check.setHours(12, 0, 0, 0);
  const todayNoon = new Date();
  todayNoon.setHours(12, 0, 0, 0);
  return check > todayNoon;
}
