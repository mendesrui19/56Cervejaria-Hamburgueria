"use client";

import {
  formatMonthYear,
  isFutureDate,
  toDateParam,
} from "@/lib/period";

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];
const WEEKDAYS_FULL = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface CalendarProps {
  viewYear: number;
  viewMonth: number;
  anchorDate: string;
  highlightedDays: Set<string>;
  onSelectDate: (date: string) => void;
  onViewMonthChange: (year: number, month: number) => void;
  compact?: boolean;
}

export function Calendar({
  viewYear,
  viewMonth,
  anchorDate,
  highlightedDays,
  onSelectDate,
  onViewMonthChange,
  compact = false,
}: CalendarProps) {
  const today = toDateParam(new Date());
  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const weekdays = compact ? WEEKDAYS : WEEKDAYS_FULL;

  const cells: Array<{ key: string; day: number | null }> = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push({ key: `empty-${i}`, day: null });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ key: `day-${day}`, day });
  }

  const goMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    onViewMonthChange(next.getFullYear(), next.getMonth());
  };

  const canGoForward =
    viewYear < new Date().getFullYear() ||
    (viewYear === new Date().getFullYear() &&
      viewMonth < new Date().getMonth());

  const navBtn = compact
    ? "h-8 w-8 rounded-lg border border-brand-gold/15 text-brand-muted hover:text-brand-gold text-sm"
    : "min-h-[44px] min-w-[44px] rounded-xl border border-brand-gold/15 text-brand-muted hover:text-brand-gold";

  return (
    <div className={compact ? "" : "mt-4"}>
      <div className={`flex items-center justify-between gap-2 ${compact ? "mb-2" : "mb-3"}`}>
        <button
          type="button"
          onClick={() => goMonth(-1)}
          className={`${navBtn} transition-colors touch-manipulation`}
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <p className={`font-bold text-brand-gold capitalize ${compact ? "text-xs" : "text-sm"}`}>
          {formatMonthYear(viewYear, viewMonth)}
        </p>
        <button
          type="button"
          onClick={() => goMonth(1)}
          disabled={!canGoForward}
          className={`${navBtn} transition-colors touch-manipulation disabled:opacity-30 disabled:pointer-events-none`}
          aria-label="Mês seguinte"
        >
          ›
        </button>
      </div>

      <div className={`grid grid-cols-7 ${compact ? "gap-0.5 mb-1" : "gap-1 mb-1"}`}>
        {weekdays.map((label, i) => (
          <div
            key={`${label}-${i}`}
            className={`text-center font-bold uppercase tracking-wide text-brand-muted ${
              compact ? "text-[9px] py-0.5" : "text-[10px] py-1"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 ${compact ? "gap-0.5" : "gap-1"}`}>
        {cells.map(({ key, day }) => {
          if (day === null) {
            return <div key={key} className={compact ? "h-8" : "aspect-square"} />;
          }

          const date = toDateParam(new Date(viewYear, viewMonth, day));
          const dateObj = new Date(viewYear, viewMonth, day);
          const disabled = isFutureDate(dateObj);
          const isAnchor = date === anchorDate;
          const isHighlighted = highlightedDays.has(date);
          const isToday = date === today;

          const sizeClass = compact
            ? "h-8 w-8 mx-auto rounded-lg text-xs"
            : "aspect-square rounded-xl text-sm min-h-[40px] w-full";

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(date)}
              className={`font-semibold transition-all touch-manipulation ${sizeClass} ${
                disabled
                  ? "text-brand-muted/30 cursor-not-allowed"
                  : isAnchor
                    ? "bg-brand-gold text-white shadow-sm"
                    : isHighlighted
                      ? "bg-brand-gold/20 text-brand-gold border border-brand-gold/30"
                      : isToday
                        ? "border border-brand-gold/40 text-brand-gold"
                        : "text-brand-muted hover:bg-brand-surface hover:text-brand-gold"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
