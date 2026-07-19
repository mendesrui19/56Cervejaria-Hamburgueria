"use client";

import { useEffect, useMemo, useState } from "react";
import { SegmentedControl } from "@/components/AppHeader";
import { Calendar } from "@/components/admin/Calendar";
import {
  canShiftAnchorForward,
  formatPeriodShort,
  getCalendarHighlight,
  parseDateParam,
  PERIOD_OPTIONS,
  shiftAnchorDate,
  toDateParam,
} from "@/lib/period";
import type { AnalyticsPeriod } from "@/lib/types";

interface PeriodSelectorProps {
  period: AnalyticsPeriod;
  anchorDate: string;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  onDateChange: (date: string) => void;
}

export function PeriodSelector({
  period,
  anchorDate,
  onPeriodChange,
  onDateChange,
}: PeriodSelectorProps) {
  const [open, setOpen] = useState(false);
  const anchor = parseDateParam(anchorDate);
  const [viewYear, setViewYear] = useState(anchor.getFullYear());
  const [viewMonth, setViewMonth] = useState(anchor.getMonth());

  const highlightedDays = useMemo(
    () => getCalendarHighlight(period, parseDateParam(anchorDate)),
    [period, anchorDate]
  );

  const today = toDateParam(new Date());
  const isToday = anchorDate === today;
  const shortLabel = formatPeriodShort(period, anchor);
  const canGoBack = true;
  const canGoForward = canShiftAnchorForward(period, anchorDate);
  const yesterday = shiftAnchorDate("day", today, -1);
  const now = new Date();
  const isThisMonth =
    period === "month" &&
    anchor.getFullYear() === now.getFullYear() &&
    anchor.getMonth() === now.getMonth();
  const lastMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const isLastMonth =
    period === "month" &&
    anchor.getFullYear() === lastMonthRef.getFullYear() &&
    anchor.getMonth() === lastMonthRef.getMonth();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSelectDate = (date: string) => {
    onDateChange(date);
    const picked = parseDateParam(date);
    setViewYear(picked.getFullYear());
    setViewMonth(picked.getMonth());
    setOpen(false);
  };

  const handleViewMonthChange = (year: number, month: number) => {
    setViewYear(year);
    setViewMonth(month);
  };

  const goToday = () => {
    onDateChange(today);
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setOpen(false);
  };

  const goShift = (delta: number) => {
    const next = shiftAnchorDate(period, anchorDate, delta);
    onDateChange(next);
    const picked = parseDateParam(next);
    setViewYear(picked.getFullYear());
    setViewMonth(picked.getMonth());
  };

  const goThisMonth = () => {
    onPeriodChange("month");
    onDateChange(today);
  };

  const goLastMonth = () => {
    onPeriodChange("month");
    onDateChange(shiftAnchorDate("month", today, -1));
  };

  const goYesterday = () => {
    onPeriodChange("day");
    onDateChange(shiftAnchorDate("day", today, -1));
  };

  const openModal = () => {
    const picked = parseDateParam(anchorDate);
    setViewYear(picked.getFullYear());
    setViewMonth(picked.getMonth());
    setOpen(true);
  };

  const navHint =
    period === "month"
      ? "mês"
      : period === "week"
        ? "semana"
        : "dia";

  return (
    <>
      <div className="mb-5 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <SegmentedControl
            options={PERIOD_OPTIONS}
            active={period}
            onChange={(id) => onPeriodChange(id as AnalyticsPeriod)}
          />

          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => goShift(-1)}
              disabled={!canGoBack}
              aria-label={`${navHint} anterior`}
              className="shrink-0 h-11 w-11 rounded-xl border border-brand-gold/25 bg-brand-card text-brand-gold font-bold text-lg touch-manipulation disabled:opacity-30"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={openModal}
              className="flex-1 min-w-0 flex items-center justify-between gap-2 rounded-xl border border-brand-gold/25 bg-brand-card px-3 py-2.5 min-h-[44px] text-sm font-semibold text-brand-gold hover:border-brand-gold/50 transition-colors touch-manipulation"
            >
              <span className="truncate capitalize">{shortLabel}</span>
              <span className="text-brand-muted text-[10px] uppercase tracking-wide shrink-0">
                Calendário
              </span>
            </button>
            <button
              type="button"
              onClick={() => goShift(1)}
              disabled={!canGoForward}
              aria-label={`${navHint} seguinte`}
              className="shrink-0 h-11 w-11 rounded-xl border border-brand-gold/25 bg-brand-card text-brand-gold font-bold text-lg touch-manipulation disabled:opacity-30"
            >
              ›
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {!isToday || period !== "day" ? (
            <button
              type="button"
              onClick={goToday}
              className="rounded-lg border border-brand-line bg-white/70 px-2.5 py-1.5 text-xs font-bold text-brand-gold touch-manipulation hover:bg-brand-gold/5"
            >
              Hoje
            </button>
          ) : null}
          <button
            type="button"
            onClick={goYesterday}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold touch-manipulation ${
              period === "day" && anchorDate === yesterday
                ? "border-brand-gold/40 bg-brand-gold/10 text-brand-gold"
                : "border-brand-line bg-white/70 text-brand-muted hover:text-brand-gold"
            }`}
          >
            Ontem
          </button>
          <button
            type="button"
            onClick={goThisMonth}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold touch-manipulation ${
              isThisMonth
                ? "border-brand-gold/40 bg-brand-gold/10 text-brand-gold"
                : "border-brand-line bg-white/70 text-brand-muted hover:text-brand-gold"
            }`}
          >
            Este mês
          </button>
          <button
            type="button"
            onClick={goLastMonth}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold touch-manipulation ${
              isLastMonth
                ? "border-brand-gold/40 bg-brand-gold/10 text-brand-gold"
                : "border-brand-line bg-white/70 text-brand-muted hover:text-brand-gold"
            }`}
          >
            Mês anterior
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            className="w-full max-w-[280px] rounded-2xl border border-brand-gold/25 bg-brand-card p-3 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Escolher data"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">
                {period === "month"
                  ? "Escolher mês"
                  : period === "week"
                    ? "Fim da semana"
                    : "Dia"}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs font-bold text-brand-muted hover:text-brand-gold touch-manipulation px-2 py-1"
              >
                Fechar
              </button>
            </div>

            <Calendar
              compact
              viewYear={viewYear}
              viewMonth={viewMonth}
              anchorDate={anchorDate}
              highlightedDays={highlightedDays}
              onSelectDate={handleSelectDate}
              onViewMonthChange={handleViewMonthChange}
            />

            {!isToday && (
              <button
                type="button"
                onClick={goToday}
                className="mt-3 w-full rounded-xl border border-brand-gold/20 py-2 text-xs font-bold text-brand-gold hover:bg-brand-gold/10 transition-colors touch-manipulation"
              >
                Ir para hoje
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
