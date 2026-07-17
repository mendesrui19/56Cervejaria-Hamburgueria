"use client";

import { useState } from "react";
import { AdminLiveBar } from "@/components/admin/AdminLiveBar";
import { exportKpisCsv } from "@/lib/admin-export";
import { formatPrice } from "@/lib/menu";
import { getPreviousPeriodLabel, parseDateParam } from "@/lib/period";
import type { AdminDailyRow, AdminHourlyRow, AdminKPIs } from "@/lib/types";

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  multibanco: "Multibanco",
  mbway: "MB Way",
  misto: "Misto",
};

function KpiCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-brand-gold/40 bg-brand-gold/5"
          : "border-brand-gold/15 bg-brand-card"
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">
        {label}
      </p>
      <p className="text-2xl lg:text-3xl font-black text-brand-gold mt-1 tabular-nums">
        {value}
      </p>
      {hint ? <p className="text-xs text-brand-muted mt-1">{hint}</p> : null}
    </div>
  );
}

function ChangeBadge({
  value,
  pct,
  suffix,
}: {
  value: number;
  pct: number;
  suffix: string;
}) {
  const positive = value > 0;
  const negative = value < 0;
  const sign = positive ? "+" : negative ? "−" : "";
  const pctText =
    Math.abs(pct) >= 0.1 ? ` (${sign}${Math.abs(pct).toFixed(0)}%)` : "";

  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold ${
        positive
          ? "bg-emerald-100 text-emerald-800"
          : negative
            ? "bg-red-100 text-red-700"
            : "bg-brand-card text-brand-muted"
      }`}
    >
      {sign}
      {suffix === "€" ? formatPrice(Math.abs(value)) : Math.abs(value)}
      {suffix !== "€" && suffix}
      {pctText}
    </span>
  );
}

function BarChart({
  title,
  rows,
  valueKey,
  emptyLabel,
}: {
  title: string;
  rows: Array<{ label: string; revenue: number; orders: number }>;
  valueKey: "revenue" | "orders";
  emptyLabel: string;
}) {
  const max = Math.max(...rows.map((r) => r[valueKey]), 1);

  if (rows.length === 0 || rows.every((r) => r[valueKey] === 0)) {
    return (
      <div className="card">
        <h3 className="text-sm font-bold text-brand-gold mb-3 uppercase tracking-wide">
          {title}
        </h3>
        <p className="text-brand-muted text-sm">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-sm font-bold text-brand-gold mb-4 uppercase tracking-wide">
        {title}
      </h3>
      <div className="flex items-end gap-1 sm:gap-1.5 h-36">
        {rows.map((row) => {
          const value = row[valueKey];
          const height = Math.max(4, (value / max) * 100);
          return (
            <div
              key={row.label}
              className="flex-1 min-w-0 flex flex-col items-center gap-1"
              title={`${row.label}: ${valueKey === "revenue" ? formatPrice(value) : value}`}
            >
              <div className="w-full flex items-end justify-center h-28">
                <div
                  className="w-full max-w-[28px] rounded-t-md bg-brand-gold/80"
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-[9px] sm:text-[10px] text-brand-muted font-semibold truncate w-full text-center">
                {row.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface AdminReportsProps {
  kpis: AdminKPIs;
  anchorDate: string;
  showLive?: boolean;
}

export function AdminReports({
  kpis,
  anchorDate,
  showLive = false,
}: AdminReportsProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const reference = parseDateParam(anchorDate);
  const prevLabel = getPreviousPeriodLabel(kpis.period, reference);
  const { comparison } = kpis;
  const topItems = kpis.topItems.slice(0, 5);

  const chartIsDay = kpis.period === "day";
  const chartRows = chartIsDay
    ? (kpis.byHour as AdminHourlyRow[])
    : (kpis.byDay as AdminDailyRow[]);

  return (
    <div className="space-y-5">
      {showLive ? <AdminLiveBar /> : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand-gold">{kpis.periodLabel}</p>
          {(comparison.previousRevenue > 0 || comparison.previousOrders > 0) && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs text-brand-muted">vs {prevLabel.toLowerCase()}</span>
              <ChangeBadge
                value={comparison.revenueChange}
                pct={comparison.revenueChangePct}
                suffix="€"
              />
              <ChangeBadge
                value={comparison.ordersChange}
                pct={0}
                suffix={` conta${Math.abs(comparison.ordersChange) !== 1 ? "s" : ""}`}
              />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => exportKpisCsv(kpis)}
          className="btn-secondary btn-sm shrink-0"
        >
          CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Faturação" value={formatPrice(kpis.revenue)} highlight />
        <KpiCard label="Contas" value={String(kpis.orderCount)} />
        <KpiCard
          label="Ticket médio"
          value={formatPrice(kpis.avgTicket)}
          hint={kpis.tips > 0 ? `Gorjetas ${formatPrice(kpis.tips)}` : undefined}
        />
        <KpiCard
          label="Tempo mesa"
          value={formatMinutes(kpis.avgTableMinutes)}
          hint={kpis.orderCount > 0 ? "Abertura → pagamento" : undefined}
        />
      </div>

      {kpis.cancelledItems.count > 0 && (
        <div className="rounded-2xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-bold">{kpis.cancelledItems.count}</span>{" "}
          {kpis.cancelledItems.count === 1 ? "item cancelado" : "itens cancelados"}
          {" · "}
          <span className="font-bold">{formatPrice(kpis.cancelledItems.value)}</span>
          {" · "}
          taxa <span className="font-bold">{(kpis.cancelRate * 100).toFixed(1)}%</span>
        </div>
      )}

      {chartRows.length > 0 && (
        <BarChart
          title={chartIsDay ? "Picos do dia" : "Faturação por dia"}
          rows={chartRows}
          valueKey="revenue"
          emptyLabel="Sem vendas neste período"
        />
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-bold text-brand-gold mb-3 uppercase tracking-wide">
            Caixa
          </h3>
          {kpis.byPayment.length === 0 ? (
            <p className="text-brand-muted text-sm">Sem pagamentos</p>
          ) : (
            <div className="space-y-2">
              {kpis.byPayment.map((row) => (
                <div
                  key={row.method}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="text-brand-muted">
                    {PAYMENT_LABELS[row.method] ?? row.method} · {row.count}
                  </span>
                  <span className="text-brand-gold font-semibold tabular-nums">
                    {formatPrice(row.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {(kpis.payments.mistoCash > 0 || kpis.payments.mistoCard > 0) && (
            <div className="mt-3 pt-3 border-t border-brand-gold/10 space-y-1.5 text-xs text-brand-muted">
              {kpis.payments.mistoCash > 0 && (
                <div className="flex justify-between gap-3">
                  <span>Misto · dinheiro</span>
                  <span className="tabular-nums font-semibold">
                    {formatPrice(kpis.payments.mistoCash)}
                  </span>
                </div>
              )}
              {kpis.payments.mistoCard > 0 && (
                <div className="flex justify-between gap-3">
                  <span>Misto · cartão</span>
                  <span className="tabular-nums font-semibold">
                    {formatPrice(kpis.payments.mistoCard)}
                  </span>
                </div>
              )}
            </div>
          )}
          {kpis.payments.cashInDrawer > 0 && (
            <div className="mt-4 pt-3 border-t border-brand-gold/10 flex justify-between gap-3">
              <span className="text-sm font-bold text-brand-muted">Na gaveta</span>
              <span className="text-lg font-black text-brand-gold tabular-nums">
                {formatPrice(kpis.payments.cashInDrawer)}
              </span>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-bold text-brand-gold mb-3 uppercase tracking-wide">
            Top produtos
          </h3>
          {topItems.length === 0 ? (
            <p className="text-brand-muted text-sm">Sem dados</p>
          ) : (
            <div className="space-y-2">
              {topItems.map((item, index) => (
                <div
                  key={item.name}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="text-brand-muted truncate">
                    <span className="text-brand-gold/50 font-bold mr-1.5">
                      {index + 1}.
                    </span>
                    {item.name}
                  </span>
                  <span className="text-brand-gold font-semibold shrink-0 tabular-nums">
                    {item.quantity} · {formatPrice(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-line bg-white/60 overflow-hidden">
        <button
          type="button"
          onClick={() => setDetailOpen((open) => !open)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left touch-manipulation"
        >
          <span className="text-sm font-bold text-brand-gold">Detalhe</span>
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
            {detailOpen ? "Fechar" : "Empregados · Mesas"}
          </span>
        </button>

        {detailOpen && (
          <div className="px-4 pb-4 space-y-4 border-t border-brand-line pt-4">
            <div>
              <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-2">
                Empregados
              </h3>
              {kpis.byWaiter.length === 0 ? (
                <p className="text-brand-muted text-sm">Sem dados</p>
              ) : (
                <div className="space-y-2">
                  {kpis.byWaiter.map((row, index) => (
                    <div
                      key={row.name}
                      className="flex items-start justify-between gap-3 text-sm rounded-xl bg-brand-surface/60 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-brand-gold font-bold truncate">
                          {index < 3 && (
                            <span className="text-brand-muted font-semibold mr-1.5">
                              {index + 1}.º
                            </span>
                          )}
                          {row.name}
                        </p>
                        <p className="text-xs text-brand-muted mt-0.5">
                          {row.orders} conta{row.orders !== 1 ? "s" : ""} · ticket{" "}
                          {formatPrice(row.avgTicket)}
                          {row.tips > 0
                            ? ` · gorjetas ${formatPrice(row.tips)}`
                            : ""}
                        </p>
                      </div>
                      <span className="text-brand-gold font-semibold shrink-0 tabular-nums">
                        {formatPrice(row.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-2">
                Por mesa
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto scrollbar-thin">
                {kpis.byTable.map((row) => (
                  <div
                    key={row.tableNumber}
                    className="flex justify-between gap-3 text-sm rounded-xl bg-brand-dark/40 px-3 py-2"
                  >
                    <span className="text-brand-muted">
                      Mesa {row.tableNumber} · {row.orders}
                    </span>
                    <span className="text-brand-gold font-semibold tabular-nums">
                      {formatPrice(row.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
