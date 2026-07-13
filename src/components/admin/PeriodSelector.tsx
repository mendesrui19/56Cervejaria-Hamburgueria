"use client";

import { useEffect, useMemo, useState } from "react";
import { SegmentedControl } from "@/components/AppHeader";
import { Calendar } from "@/components/admin/Calendar";
import {
  formatPeriodShort,
  getCalendarHighlight,
  parseDateParam,
  PERIOD_OPTIONS,
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

  const isToday = anchorDate === toDateParam(new Date());
  const shortLabel = formatPeriodShort(period, anchor);

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
    const today = toDateParam(new Date());
    onDateChange(today);
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setOpen(false);
  };

  const openModal = () => {
    const picked = parseDateParam(anchorDate);
    setViewYear(picked.getFullYear());
    setViewMonth(picked.getMonth());
    setOpen(true);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <SegmentedControl
          options={PERIOD_OPTIONS}
          active={period}
          onChange={(id) => onPeriodChange(id as AnalyticsPeriod)}
        />
        <button
          type="button"
          onClick={openModal}
          className="flex items-center justify-between gap-2 rounded-xl border border-brand-gold/25 bg-brand-card px-3 py-2.5 min-h-[44px] text-sm font-semibold text-brand-gold hover:border-brand-gold/50 transition-colors touch-manipulation sm:min-w-[180px]"
        >
          <span className="truncate capitalize">{shortLabel}</span>
          <span className="text-brand-muted text-xs shrink-0">Calendário</span>
        </button>
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
                Data
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
