"use client";

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
      <p className="text-2xl lg:text-3xl font-black text-brand-gold mt-1">
        {value}
      </p>
      {hint && <p className="text-xs text-brand-muted mt-1">{hint}</p>}
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
    Math.abs(pct) >= 0.1 ? ` (${sign}${pct.toFixed(0)}%)` : "";

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
                  className="w-full max-w-[28px] rounded-t-md bg-brand-gold/80 transition-all"
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

function PaymentBreakdown({ kpis }: { kpis: AdminKPIs }) {
  const { payments } = kpis;
  const rows = [
    { label: "Dinheiro", value: payments.dinheiro },
    { label: "Multibanco", value: payments.multibanco },
    { label: "MB Way", value: payments.mbway },
    ...(payments.mistoCash + payments.mistoCard > 0
      ? [
          { label: "Misto (dinheiro)", value: payments.mistoCash },
          { label: "Misto (cartão)", value: payments.mistoCard },
        ]
      : []),
  ].filter((r) => r.value > 0);

  return (
    <div className="card">
      <h3 className="text-sm font-bold text-brand-gold mb-3 uppercase tracking-wide">
        Caixa · pagamentos
      </h3>
      {rows.length === 0 ? (
        <p className="text-brand-muted text-sm">Sem pagamentos</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-3 text-sm">
              <span className="text-brand-muted">{row.label}</span>
              <span className="text-brand-gold font-semibold tabular-nums">
                {formatPrice(row.value)}
              </span>
            </div>
          ))}
        </div>
      )}
      {payments.cashInDrawer > 0 && (
        <div className="mt-4 pt-3 border-t border-brand-gold/10 flex justify-between gap-3">
          <span className="text-sm font-bold text-brand-muted">Na gaveta</span>
          <span className="text-lg font-black text-brand-gold tabular-nums">
            {formatPrice(payments.cashInDrawer)}
          </span>
        </div>
      )}
    </div>
  );
}

interface AdminReportsProps {
  kpis: AdminKPIs;
  anchorDate: string;
}

export function AdminReports({ kpis, anchorDate }: AdminReportsProps) {
  const reference = parseDateParam(anchorDate);
  const prevLabel = getPreviousPeriodLabel(kpis.period, reference);
  const { comparison } = kpis;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-brand-muted">{kpis.periodLabel}</p>
          {comparison.previousRevenue > 0 || comparison.previousOrders > 0 ? (
            <p className="text-xs text-brand-muted mt-1">
              vs {prevLabel.toLowerCase()}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => exportKpisCsv(kpis)}
          className="btn-secondary btn-sm shrink-0"
        >
          Exportar CSV
        </button>
      </div>

      {(comparison.previousRevenue > 0 || kpis.orderCount > 0) && (
        <div className="flex flex-wrap gap-2">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Faturação" value={formatPrice(kpis.revenue)} highlight />
        <KpiCard label="Contas" value={String(kpis.orderCount)} />
        <KpiCard label="Ticket médio" value={formatPrice(kpis.avgTicket)} />
        <KpiCard label="Itens vendidos" value={String(kpis.itemsSold)} />
      </div>

      {kpis.cancelledItems.count > 0 && (
        <div className="rounded-2xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-bold">{kpis.cancelledItems.count}</span>{" "}
          {kpis.cancelledItems.count === 1 ? "item cancelado" : "itens cancelados"}{" "}
          em contas fechadas · valor estimado{" "}
          <span className="font-bold">
            {formatPrice(kpis.cancelledItems.value)}
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <PaymentBreakdown kpis={kpis} />

        <div className="card">
          <h3 className="text-sm font-bold text-brand-gold mb-3 uppercase tracking-wide">
            Por método
          </h3>
          <div className="space-y-2">
            {kpis.byPayment.length === 0 ? (
              <p className="text-brand-muted text-sm">Sem dados</p>
            ) : (
              kpis.byPayment.map((row) => (
                <div
                  key={row.method}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="text-brand-muted">
                    {PAYMENT_LABELS[row.method] ?? row.method} ({row.count})
                  </span>
                  <span className="text-brand-gold font-semibold tabular-nums">
                    {formatPrice(row.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {kpis.byDay.length > 0 && (
        <BarChart
          title="Faturação por dia"
          rows={kpis.byDay as AdminDailyRow[]}
          valueKey="revenue"
          emptyLabel="Sem vendas neste período"
        />
      )}

      {kpis.byHour.length > 0 && (
        <BarChart
          title={
            kpis.period === "day"
              ? "Faturação por hora"
              : "Horários de pico (contas por hora)"
          }
          rows={kpis.byHour as AdminHourlyRow[]}
          valueKey={kpis.period === "day" ? "revenue" : "orders"}
          emptyLabel="Sem pagamentos registados"
        />
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-bold text-brand-gold mb-3 uppercase tracking-wide">
            Top produtos
          </h3>
          {kpis.topItems.length === 0 ? (
            <p className="text-brand-muted text-sm">Sem dados</p>
          ) : (
            <div className="space-y-2">
              {kpis.topItems.map((item) => (
                <div
                  key={item.name}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="text-brand-muted truncate">{item.name}</span>
                  <span className="text-brand-gold font-semibold shrink-0 tabular-nums">
                    {item.quantity} · {formatPrice(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-bold text-brand-gold mb-3 uppercase tracking-wide">
            Ranking empregados
          </h3>
          <div className="space-y-2">
            {kpis.byWaiter.length === 0 ? (
              <p className="text-brand-muted text-sm">Sem dados</p>
            ) : (
              kpis.byWaiter.map((row, index) => (
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
                      {row.orders} conta{row.orders !== 1 ? "s" : ""} · ticket médio{" "}
                      {formatPrice(row.avgTicket)}
                      {row.tips > 0 ? ` · gorjetas ${formatPrice(row.tips)}` : ""}
                    </p>
                  </div>
                  <span className="text-brand-gold font-semibold shrink-0 tabular-nums">
                    {formatPrice(row.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="text-sm font-bold text-brand-gold mb-3 uppercase tracking-wide">
            Por mesa
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto scrollbar-thin">
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

      <p className="text-xs text-brand-muted text-center">
        Gorjetas: {formatPrice(kpis.tips)} · Subtotal:{" "}
        {formatPrice(kpis.subtotal)}
      </p>
    </div>
  );
}
