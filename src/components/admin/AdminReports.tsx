"use client";

import { useState } from "react";
import { AdminLiveBar } from "@/components/admin/AdminLiveBar";
import { exportKpisCsv } from "@/lib/admin-export";
import { formatPrice } from "@/lib/menu";
import {
  countElapsedDaysInPeriod,
  getPreviousPeriodShortLabel,
  parseDateParam,
} from "@/lib/period";
import type { AdminDailyRow, AdminHourlyRow, AdminKPIs } from "@/lib/types";

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  multibanco: "Multibanco",
  mbway: "MB Way",
  misto: "Misto",
};

function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <h2 className="text-[11px] uppercase tracking-widest font-bold text-brand-muted">
        {children}
      </h2>
      {action}
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
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
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
      <div className="rounded-2xl border border-brand-line bg-white/70 p-4">
        <h3 className="text-sm font-bold text-brand-gold mb-2">{title}</h3>
        <p className="text-brand-muted text-sm">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-line bg-white/70 p-4">
      <h3 className="text-sm font-bold text-brand-gold mb-3">{title}</h3>
      <div className="flex items-end gap-1 sm:gap-1.5 h-32">
        {rows.map((row) => {
          const value = row[valueKey];
          const height = Math.max(4, (value / max) * 100);
          return (
            <div
              key={row.label}
              className="flex-1 min-w-0 flex flex-col items-center gap-1"
              title={`${row.label}: ${valueKey === "revenue" ? formatPrice(value) : value}`}
            >
              <div className="w-full flex items-end justify-center h-24">
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

function MoneyRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className={`text-sm ${strong ? "font-bold text-brand-gold" : "text-brand-muted"}`}>
        {label}
      </span>
      <span
        className={`tabular-nums shrink-0 ${
          strong
            ? "text-lg font-black text-brand-gold"
            : "text-sm font-semibold text-brand-gold"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

interface AdminReportsProps {
  kpis: AdminKPIs;
  anchorDate: string;
  showLive?: boolean;
  onOpenOperations?: () => void;
}

export function AdminReports({
  kpis,
  anchorDate,
  showLive = false,
  onOpenOperations,
}: AdminReportsProps) {
  const [tablesOpen, setTablesOpen] = useState(false);
  const reference = parseDateParam(anchorDate);
  const prevShort = getPreviousPeriodShortLabel(kpis.period);
  const { comparison } = kpis;
  const topItems = kpis.topItems.slice(0, 5);
  const topWaiters = kpis.byWaiter.slice(0, 5);
  const hasComparison =
    comparison.previousRevenue > 0 || comparison.previousOrders > 0;

  const chartIsDay = kpis.period === "day";
  const chartRows = chartIsDay
    ? (kpis.byHour as AdminHourlyRow[])
    : (kpis.byDay as AdminDailyRow[]);

  const elapsedDays = countElapsedDaysInPeriod(kpis.period, reference);
  const avgPerDay = kpis.revenue / elapsedDays;
  const bestDay =
    !chartIsDay && chartRows.length > 0
      ? [...(chartRows as AdminDailyRow[])].sort((a, b) => b.revenue - a.revenue)[0]
      : null;
  const isPeriodView = kpis.period === "week" || kpis.period === "month";
  const isPastClose = !showLive;
  const now = new Date();
  const isCurrentMonth =
    kpis.period === "month" &&
    reference.getFullYear() === now.getFullYear() &&
    reference.getMonth() === now.getMonth();
  const periodCloseTitle =
    kpis.period === "month"
      ? isCurrentMonth
        ? "Resumo do mês"
        : "Fecho do mês"
      : kpis.period === "week"
        ? "Resumo da semana"
        : "Fecho do dia";

  return (
    <div className="space-y-6">
      {showLive ? <AdminLiveBar onOpenOperations={onOpenOperations} /> : null}

      {isPastClose ? (
        <section className="rounded-2xl border border-brand-line bg-white/70 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-widest font-bold text-brand-muted">
                {periodCloseTitle}
              </p>
              <p className="text-sm font-bold text-brand-gold mt-0.5 capitalize">
                {kpis.periodLabel}
              </p>
            </div>
            {hasComparison ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-brand-muted">vs {prevShort}</span>
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
            ) : null}
          </div>
          {isPeriodView ? (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-brand-line pt-3">
              <div>
                <p className="text-lg font-black text-brand-gold tabular-nums">
                  {formatPrice(avgPerDay)}
                </p>
                <p className="text-[11px] text-brand-muted font-semibold">
                  Média / dia · {elapsedDays} dias
                </p>
              </div>
              {bestDay && bestDay.revenue > 0 ? (
                <div>
                  <p className="text-lg font-black text-brand-gold tabular-nums">
                    {formatPrice(bestDay.revenue)}
                  </p>
                  <p className="text-[11px] text-brand-muted font-semibold">
                    Melhor dia · {bestDay.label}
                  </p>
                </div>
              ) : null}
              <div>
                <p className="text-lg font-black text-brand-gold tabular-nums">
                  {comparison.previousRevenue > 0
                    ? formatPrice(comparison.previousRevenue)
                    : "—"}
                </p>
                <p className="text-[11px] text-brand-muted font-semibold">
                  Período anterior
                </p>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* 1. Dinheiro */}
      <section>
        <SectionTitle
          action={
            <button
              type="button"
              onClick={() => exportKpisCsv(kpis)}
              className="btn-secondary btn-sm shrink-0"
            >
              CSV
            </button>
          }
        >
          Dinheiro
        </SectionTitle>

        {showLive && hasComparison ? (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs text-brand-muted">vs {prevShort}</span>
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
        ) : null}

        <div className="rounded-2xl border border-brand-gold/30 bg-brand-gold/[0.04] p-4 sm:p-5">
          <div className="grid sm:grid-cols-[1.2fr_1fr] gap-5">
            <div>
              <p className="text-[11px] uppercase tracking-widest font-bold text-brand-muted">
                Faturação cobrada
              </p>
              <p className="text-4xl sm:text-5xl font-black text-brand-gold tabular-nums mt-1 leading-none">
                {formatPrice(kpis.revenue)}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xl font-black text-brand-gold tabular-nums">
                    {kpis.orderCount}
                  </p>
                  <p className="text-[11px] text-brand-muted font-semibold">Contas</p>
                </div>
                <div>
                  <p className="text-xl font-black text-brand-gold tabular-nums">
                    {formatPrice(kpis.avgTicket)}
                  </p>
                  <p className="text-[11px] text-brand-muted font-semibold">Ticket méd.</p>
                </div>
                <div>
                  <p className="text-xl font-black text-brand-gold tabular-nums">
                    {kpis.itemsSold}
                  </p>
                  <p className="text-[11px] text-brand-muted font-semibold">Itens</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-brand-line/80 bg-white/70 px-3.5 py-3">
              <p className="text-[11px] uppercase tracking-widest font-bold text-brand-muted mb-1">
                Caixa
              </p>
              {kpis.byPayment.length === 0 ? (
                <p className="text-sm text-brand-muted py-2">Sem pagamentos</p>
              ) : (
                <div className="divide-y divide-brand-line/60">
                  {kpis.byPayment.map((row) => (
                    <MoneyRow
                      key={row.method}
                      label={`${PAYMENT_LABELS[row.method] ?? row.method} · ${row.count}`}
                      value={formatPrice(row.amount)}
                    />
                  ))}
                </div>
              )}
              {(kpis.payments.mistoCash > 0 || kpis.payments.mistoCard > 0) && (
                <div className="mt-2 pt-2 border-t border-brand-line/60 space-y-0.5 text-xs text-brand-muted">
                  {kpis.payments.mistoCash > 0 ? (
                    <div className="flex justify-between gap-2">
                      <span>Misto · dinheiro</span>
                      <span className="tabular-nums font-semibold">
                        {formatPrice(kpis.payments.mistoCash)}
                      </span>
                    </div>
                  ) : null}
                  {kpis.payments.mistoCard > 0 ? (
                    <div className="flex justify-between gap-2">
                      <span>Misto · cartão</span>
                      <span className="tabular-nums font-semibold">
                        {formatPrice(kpis.payments.mistoCard)}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
              {kpis.payments.cashInDrawer > 0 ? (
                <div className="mt-3 pt-2 border-t border-brand-gold/20">
                  <MoneyRow
                    label="Na gaveta"
                    value={formatPrice(kpis.payments.cashInDrawer)}
                    strong
                  />
                </div>
              ) : null}
              {kpis.tips > 0 ? (
                <div className="mt-1">
                  <MoneyRow label="Gorjetas" value={formatPrice(kpis.tips)} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Serviço / excepções */}
      <section>
        <SectionTitle>Serviço</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-brand-line bg-white/70 px-4 py-3">
            <p className="text-[11px] uppercase tracking-widest font-bold text-brand-muted">
              Tempo médio mesa
            </p>
            <p className="text-2xl font-black text-brand-gold tabular-nums mt-1">
              {formatMinutes(kpis.avgTableMinutes)}
            </p>
            <p className="text-xs text-brand-muted mt-1">Abertura → pagamento</p>
          </div>
          <div
            className={`rounded-2xl border px-4 py-3 ${
              kpis.cancelledItems.count > 0
                ? "border-amber-300/60 bg-amber-50"
                : "border-brand-line bg-white/70"
            }`}
          >
            <p
              className={`text-[11px] uppercase tracking-widest font-bold ${
                kpis.cancelledItems.count > 0 ? "text-amber-900/70" : "text-brand-muted"
              }`}
            >
              Cancelamentos
            </p>
            {kpis.cancelledItems.count > 0 ? (
              <>
                <p className="text-2xl font-black text-amber-950 tabular-nums mt-1">
                  {kpis.cancelledItems.count}
                  <span className="text-base font-bold ml-1.5">
                    · {formatPrice(kpis.cancelledItems.value)}
                  </span>
                </p>
                <p className="text-xs text-amber-900/80 mt-1 font-semibold">
                  Taxa {(kpis.cancelRate * 100).toFixed(1)}%
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black text-brand-gold tabular-nums mt-1">0</p>
                <p className="text-xs text-brand-muted mt-1">Nenhum neste período</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 3. Ritmo */}
      {chartRows.length > 0 ? (
        <section>
          <SectionTitle>Ritmo</SectionTitle>
          <BarChart
            title={chartIsDay ? "Por hora" : "Por dia"}
            rows={chartRows}
            valueKey="revenue"
            emptyLabel="Sem vendas neste período"
          />
        </section>
      ) : null}

      {/* 4. Quem / o quê */}
      <section>
        <SectionTitle>Vendas</SectionTitle>
        <div className="grid lg:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-brand-line bg-white/70 p-4">
            <h3 className="text-sm font-bold text-brand-gold mb-3">Produtos</h3>
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
                      <span className="text-brand-gold/45 font-bold mr-1.5">
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

          <div className="rounded-2xl border border-brand-line bg-white/70 p-4">
            <h3 className="text-sm font-bold text-brand-gold mb-3">Empregados</h3>
            {topWaiters.length === 0 ? (
              <p className="text-brand-muted text-sm">Sem dados</p>
            ) : (
              <div className="space-y-2.5">
                {topWaiters.map((row, index) => (
                  <div
                    key={row.name}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="text-brand-gold font-bold truncate">
                        <span className="text-brand-gold/45 font-bold mr-1.5">
                          {index + 1}.
                        </span>
                        {row.name}
                      </p>
                      <p className="text-xs text-brand-muted mt-0.5">
                        {row.orders} conta{row.orders !== 1 ? "s" : ""} · ticket{" "}
                        {formatPrice(row.avgTicket)}
                        {row.tips > 0 ? ` · gorj. ${formatPrice(row.tips)}` : ""}
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
        </div>
      </section>

      {/* 5. Mesas — secundário */}
      <section className="rounded-2xl border border-brand-line bg-white/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setTablesOpen((open) => !open)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left touch-manipulation"
        >
          <span className="text-[11px] uppercase tracking-widest font-bold text-brand-muted">
            Por mesa
          </span>
          <span className="text-xs font-semibold text-brand-muted">
            {tablesOpen ? "Fechar" : `${kpis.byTable.length} mesas`}
          </span>
        </button>
        {tablesOpen ? (
          <div className="px-4 pb-4 border-t border-brand-line pt-3">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto scrollbar-thin">
              {kpis.byTable.map((row) => (
                <div
                  key={row.tableNumber}
                  className="flex justify-between gap-3 text-sm rounded-lg bg-brand-surface/70 px-3 py-2"
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
        ) : null}
      </section>
    </div>
  );
}
