"use client";

import { fetchState } from "@/lib/api";
import { formatPrice } from "@/lib/menu";
import { calculateOrderTotal } from "@/lib/utils";
import type { RestaurantState } from "@/lib/types";
import { usePolling } from "@/hooks/usePolling";

function liveSnapshot(state: RestaurantState) {
  let readyFood = 0;
  let readyDrinks = 0;
  let preparing = 0;
  let openValue = 0;
  let alerts = 0;

  for (const table of state.tables) {
    if (!table.orderId) continue;
    if (table.status !== "ocupada" && table.status !== "a_pagar") continue;
    const order = state.orders.find((o) => o.id === table.orderId);
    if (!order || order.paidAt) continue;

    openValue += calculateOrderTotal(order);
    if (order.kitchenAlert || order.barAlert) alerts += 1;

    for (const item of order.items) {
      if (item.isAddon || item.status === "cancelado" || item.status === "entregue") {
        continue;
      }
      if (item.status === "pronto") {
        if (item.skipKitchen) readyDrinks += item.quantity;
        else readyFood += item.quantity;
      } else if (item.status === "em_preparacao") {
        preparing += item.quantity;
      }
    }
  }

  const occupied = state.tables.filter(
    (t) => t.status === "ocupada" || t.status === "a_pagar"
  ).length;
  const toPay = state.tables.filter((t) => t.status === "a_pagar").length;
  const ready = readyFood + readyDrinks;

  return { occupied, toPay, openValue, alerts, ready, readyFood, readyDrinks, preparing };
}

interface AdminLiveBarProps {
  onOpenOperations?: () => void;
}

export function AdminLiveBar({ onOpenOperations }: AdminLiveBarProps) {
  const { data: state } = usePolling<RestaurantState>(fetchState, 5000);

  if (!state) {
    return (
      <section className="rounded-2xl border border-brand-line bg-white/70 px-4 py-3 text-sm text-brand-muted">
        A carregar sala…
      </section>
    );
  }

  const snap = liveSnapshot(state);
  const flags = [
    snap.toPay > 0
      ? `${snap.toPay} a pagar`
      : null,
    snap.ready > 0
      ? snap.readyFood > 0 && snap.readyDrinks > 0
        ? `${snap.ready} prontos (${snap.readyFood}c · ${snap.readyDrinks}b)`
        : `${snap.ready} prontos`
      : null,
    snap.alerts > 0
      ? `${snap.alerts} alerta${snap.alerts !== 1 ? "s" : ""}`
      : null,
  ].filter(Boolean) as string[];

  return (
    <section className="rounded-2xl border border-emerald-300/50 bg-emerald-50/90 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
        <h2 className="text-[11px] uppercase tracking-widest font-bold text-emerald-900/70">
          Sala agora
        </h2>
        {onOpenOperations ? (
          <button
            type="button"
            onClick={onOpenOperations}
            className="text-xs font-bold text-emerald-900 underline underline-offset-2 touch-manipulation"
          >
            Mapa →
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-emerald-200/40 mx-3 mb-3 rounded-xl overflow-hidden border border-emerald-200/60">
        <button
          type="button"
          onClick={onOpenOperations}
          className="bg-emerald-50/95 px-3 py-3 text-left touch-manipulation hover:bg-white/80"
        >
          <p className="text-2xl font-black tabular-nums text-emerald-950">
            {snap.occupied}
          </p>
          <p className="text-[11px] font-semibold text-emerald-900/75">Mesas</p>
        </button>
        <button
          type="button"
          onClick={onOpenOperations}
          className="bg-emerald-50/95 px-3 py-3 text-left touch-manipulation hover:bg-white/80"
        >
          <p
            className={`text-2xl font-black tabular-nums ${
              snap.toPay > 0 ? "text-orange-900" : "text-emerald-950"
            }`}
          >
            {snap.toPay}
          </p>
          <p className="text-[11px] font-semibold text-emerald-900/75">A pagar</p>
        </button>
        <button
          type="button"
          onClick={onOpenOperations}
          className="bg-emerald-50/95 px-3 py-3 text-left touch-manipulation hover:bg-white/80"
        >
          <p className="text-xl sm:text-2xl font-black tabular-nums text-emerald-950 leading-tight">
            {formatPrice(snap.openValue)}
          </p>
          <p className="text-[11px] font-semibold text-emerald-900/75">Em aberto</p>
        </button>
        <button
          type="button"
          onClick={onOpenOperations}
          className="bg-emerald-50/95 px-3 py-3 text-left touch-manipulation hover:bg-white/80"
        >
          <p className="text-2xl font-black tabular-nums text-emerald-950">
            {snap.preparing}
          </p>
          <p className="text-[11px] font-semibold text-emerald-900/75">A preparar</p>
        </button>
      </div>

      {flags.length > 0 ? (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {flags.map((flag) => (
            <span
              key={flag}
              className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${
                flag.includes("alerta")
                  ? "bg-red-100 text-red-900 border border-red-200"
                  : flag.includes("pagar")
                    ? "bg-orange-100 text-orange-950 border border-orange-200"
                    : "bg-green-100 text-green-950 border border-green-200"
              }`}
            >
              {flag}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
