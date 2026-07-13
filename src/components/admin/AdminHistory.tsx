"use client";

import { useMemo, useState } from "react";
import { exportHistoryCsv } from "@/lib/admin-export";
import { formatPrice } from "@/lib/menu";
import { formatPeriodLabel, parseDateParam } from "@/lib/period";
import { formatPaymentDetail, PAYMENT_LABELS } from "@/lib/payments";
import type {
  AnalyticsPeriod,
  OrderHistoryEntry,
  PaymentMethod,
} from "@/lib/types";

interface AdminHistoryProps {
  history: OrderHistoryEntry[];
  period: AnalyticsPeriod;
  anchorDate: string;
}

function HistoryEntryCard({ entry }: { entry: OrderHistoryEntry }) {
  const [open, setOpen] = useState(false);
  const paid = new Date(entry.paidAt);

  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left touch-manipulation"
      >
        <div className="flex flex-wrap justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-brand-gold text-lg">
              Mesa {entry.tableNumber}
            </p>
            <p className="text-sm text-brand-muted">{entry.waiterName}</p>
            <p className="text-xs text-brand-muted mt-0.5">
              {paid.toLocaleDateString("pt-PT")}{" "}
              {paid.toLocaleTimeString("pt-PT", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" · "}
              {formatPaymentDetail(entry)}
              {entry.tip > 0 && ` · gorjeta ${formatPrice(entry.tip)}`}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-brand-gold tabular-nums">
              {formatPrice(entry.total)}
            </p>
            <p className="text-[11px] text-brand-muted mt-0.5">
              {entry.itemCount} {entry.itemCount === 1 ? "item" : "itens"}
              {entry.cancelledItems.length > 0 &&
                ` · ${entry.cancelledItems.length} cancelado${entry.cancelledItems.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <p className="text-[11px] text-brand-gold/70 mt-2 font-semibold">
          {open ? "Ocultar detalhe ▲" : "Ver detalhe ▼"}
        </p>
      </button>

      {open && (
        <div className="border-t border-brand-gold/10 pt-3 mt-3 space-y-3">
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
            {entry.items.map((item, idx) => (
              <div
                key={`${entry.id}-${idx}`}
                className="flex justify-between text-sm text-brand-muted"
              >
                <span className="truncate pr-2">
                  {item.quantity > 1 && `${item.quantity}× `}
                  {item.name}
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {entry.cancelledItems.length > 0 && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest font-bold text-red-700 mb-1">
                Cancelados nesta conta
              </p>
              {entry.cancelledItems.map((item, idx) => (
                <div
                  key={`${entry.id}-c-${idx}`}
                  className="flex justify-between text-sm text-red-800/80 line-through"
                >
                  <span>
                    {item.quantity > 1 && `${item.quantity}× `}
                    {item.name}
                  </span>
                  <span className="tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminHistory({
  history,
  period,
  anchorDate,
}: AdminHistoryProps) {
  const reference = parseDateParam(anchorDate);
  const periodLabel = formatPeriodLabel(period, reference);

  const [filterTable, setFilterTable] = useState("");
  const [filterWaiter, setFilterWaiter] = useState("");
  const [filterPayment, setFilterPayment] = useState<PaymentMethod | "">("");
  const [search, setSearch] = useState("");

  const tables = useMemo(
    () => [...new Set(history.map((h) => h.tableNumber))].sort((a, b) => a - b),
    [history]
  );

  const waiters = useMemo(
    () => [...new Set(history.map((h) => h.waiterName))].sort(),
    [history]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return history.filter((entry) => {
      if (filterTable && entry.tableNumber !== Number(filterTable)) return false;
      if (filterWaiter && entry.waiterName !== filterWaiter) return false;
      if (filterPayment && entry.paymentMethod !== filterPayment) return false;
      if (!q) return true;

      const haystack = [
        entry.waiterName,
        String(entry.tableNumber),
        ...entry.items.map((i) => i.name),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [history, filterTable, filterWaiter, filterPayment, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, entry) => {
        acc.revenue += entry.total;
        acc.tips += entry.tip;
        acc.orders += 1;
        return acc;
      },
      { revenue: 0, tips: 0, orders: 0 }
    );
  }, [filtered]);

  if (history.length === 0) {
    return (
      <p className="text-center text-brand-muted py-16">
        Sem contas fechadas em {periodLabel.toLowerCase()}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-brand-muted">
            {history.length} conta{history.length !== 1 ? "s" : ""} ·{" "}
            <span className="text-brand-gold font-semibold">{periodLabel}</span>
          </p>
          {filtered.length !== history.length && (
            <p className="text-xs text-brand-muted mt-0.5">
              A mostrar {filtered.length} com filtros activos
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => exportHistoryCsv(filtered, periodLabel)}
          className="btn-secondary btn-sm shrink-0"
        >
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-brand-gold/15 bg-brand-card px-3 py-2">
          <p className="text-[10px] uppercase text-brand-muted font-bold">
            Total filtrado
          </p>
          <p className="text-lg font-black text-brand-gold tabular-nums">
            {formatPrice(totals.revenue)}
          </p>
        </div>
        <div className="rounded-xl border border-brand-gold/15 bg-brand-card px-3 py-2">
          <p className="text-[10px] uppercase text-brand-muted font-bold">
            Contas
          </p>
          <p className="text-lg font-black text-brand-gold tabular-nums">
            {totals.orders}
          </p>
        </div>
        <div className="rounded-xl border border-brand-gold/15 bg-brand-card px-3 py-2">
          <p className="text-[10px] uppercase text-brand-muted font-bold">
            Gorjetas
          </p>
          <p className="text-lg font-black text-brand-gold tabular-nums">
            {formatPrice(totals.tips)}
          </p>
        </div>
      </div>

      <input
        className="input w-full"
        placeholder="Pesquisar mesa, empregado ou produto…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <select
          className="input text-sm py-2 min-h-[40px] w-auto"
          value={filterWaiter}
          onChange={(e) => setFilterWaiter(e.target.value)}
        >
          <option value="">Todos empregados</option>
          {waiters.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          className="input text-sm py-2 min-h-[40px] w-auto"
          value={filterPayment}
          onChange={(e) =>
            setFilterPayment(e.target.value as PaymentMethod | "")
          }
        >
          <option value="">Todos pagamentos</option>
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => (
            <option key={method} value={method}>
              {PAYMENT_LABELS[method]}
            </option>
          ))}
        </select>
      </div>

      {tables.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setFilterTable("")}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold ${
              !filterTable
                ? "bg-brand-gold text-white"
                : "bg-brand-card text-brand-muted border border-brand-gold/10"
            }`}
          >
            Todas
          </button>
          {tables.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setFilterTable(String(n))}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold ${
                filterTable === String(n)
                  ? "bg-brand-gold text-white"
                  : "bg-brand-card text-brand-muted border border-brand-gold/10"
              }`}
            >
              Mesa {n}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-brand-muted py-12">
            Nenhuma conta corresponde aos filtros
          </p>
        ) : (
          filtered.map((entry) => (
            <HistoryEntryCard key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}
