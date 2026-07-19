"use client";

import { fetchState } from "@/lib/api";
import { formatPrice } from "@/lib/menu";
import type { Order, RestaurantState, Table } from "@/lib/types";
import { calculateOrderTotal } from "@/lib/utils";
import { usePolling } from "@/hooks/usePolling";

function tableMeta(
  table: Table,
  orders: Order[]
): {
  waiter?: string;
  total?: number;
  readyFood: number;
  readyDrinks: number;
  hasAlert: boolean;
} {
  if (!table.orderId) {
    return { readyFood: 0, readyDrinks: 0, hasAlert: false };
  }

  const order = orders.find((entry) => entry.id === table.orderId);
  if (!order) return { readyFood: 0, readyDrinks: 0, hasAlert: false };

  let readyFood = 0;
  let readyDrinks = 0;
  for (const item of order.items) {
    if (item.isAddon || item.status !== "pronto") continue;
    if (item.skipKitchen) readyDrinks += item.quantity;
    else readyFood += item.quantity;
  }

  return {
    waiter: order.waiterName,
    total: calculateOrderTotal(order),
    readyFood,
    readyDrinks,
    hasAlert: Boolean(order.kitchenAlert || order.barAlert),
  };
}

function tableClass(table: Table, meta: ReturnType<typeof tableMeta>) {
  if (meta.hasAlert) {
    return "bg-red-50 border-2 border-red-400 text-red-900";
  }
  if (meta.readyFood + meta.readyDrinks > 0) {
    return "bg-green-50 border-2 border-green-400 text-green-900";
  }
  if (table.status === "a_pagar") {
    return "bg-orange-50 border-2 border-orange-400 text-orange-900";
  }
  if (table.status === "ocupada") {
    return "bg-amber-50 border-2 border-amber-400 text-amber-900";
  }
  return "bg-white border border-brand-line text-brand-muted";
}

function statusLabel(
  table: Table,
  meta: ReturnType<typeof tableMeta>
): string {
  if (meta.hasAlert) return "Alerta";
  const ready = meta.readyFood + meta.readyDrinks;
  if (ready > 0) {
    if (meta.readyFood > 0 && meta.readyDrinks > 0) {
      return `${meta.readyFood}c · ${meta.readyDrinks}b`;
    }
    return `${ready} prontos`;
  }
  if (table.status === "livre") return "Livre";
  if (table.status === "a_pagar") return "Conta";
  return "Ocupada";
}

export function AdminTableMap() {
  const { data: state } = usePolling<RestaurantState>(fetchState, 5000);

  if (!state) {
    return (
      <div className="card text-brand-muted text-sm text-center py-8">
        A carregar mapa de mesas…
      </div>
    );
  }

  const unpaidOrders = state.orders.filter((o) => !o.paidAt);
  const occupied = state.tables.filter(
    (t) => t.status === "ocupada" || t.status === "a_pagar"
  ).length;
  const toPay = state.tables.filter((t) => t.status === "a_pagar").length;
  const openTotal = unpaidOrders.reduce(
    (sum, order) => sum + calculateOrderTotal(order),
    0
  );

  let alerts = 0;
  let readyTables = 0;
  for (const table of state.tables) {
    if (table.status === "livre" || !table.orderId) continue;
    const meta = tableMeta(table, state.orders);
    if (meta.hasAlert) alerts += 1;
    if (meta.readyFood + meta.readyDrinks > 0) readyTables += 1;
  }

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-2xl border border-brand-line bg-white/70 px-3 py-3">
          <p className="text-2xl font-black text-brand-gold tabular-nums">{occupied}</p>
          <p className="text-xs text-brand-muted font-semibold">Mesas activas</p>
        </div>
        <div className="rounded-2xl border border-orange-200 bg-orange-50/80 px-3 py-3">
          <p className="text-2xl font-black text-orange-900 tabular-nums">{toPay}</p>
          <p className="text-xs text-orange-900/80 font-semibold">A pagar</p>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50/80 px-3 py-3">
          <p className="text-2xl font-black text-green-900 tabular-nums">{readyTables}</p>
          <p className="text-xs text-green-900/80 font-semibold">Com prontos</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/80 px-3 py-3">
          <p className="text-2xl font-black text-red-900 tabular-nums">{alerts}</p>
          <p className="text-xs text-red-900/80 font-semibold">Alertas</p>
        </div>
      </div>

      <div className="card border-brand-gold/20">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">
              Operações em tempo real
            </p>
            <h3 className="text-lg font-bold text-brand-gold mt-1">
              Mapa de mesas
            </h3>
          </div>
          <div className="text-right text-sm">
            <p className="text-brand-muted">
              {formatPrice(openTotal)} em aberto (não cobrado)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 text-[10px] font-bold uppercase tracking-wide">
          <span className="rounded-md bg-white border border-brand-line px-2 py-1 text-brand-muted">
            Livre
          </span>
          <span className="rounded-md bg-amber-50 border border-amber-300 px-2 py-1 text-amber-900">
            Ocupada
          </span>
          <span className="rounded-md bg-orange-50 border border-orange-300 px-2 py-1 text-orange-900">
            Conta
          </span>
          <span className="rounded-md bg-green-50 border border-green-300 px-2 py-1 text-green-900">
            Prontos
          </span>
          <span className="rounded-md bg-red-50 border border-red-300 px-2 py-1 text-red-900">
            Alerta
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {state.tables.map((table) => {
            const meta = tableMeta(table, state.orders);

            return (
              <div
                key={table.number}
                className={`rounded-xl p-2 min-h-[88px] text-center ${tableClass(table, meta)}`}
              >
                <p className="text-xl font-black leading-none">{table.number}</p>
                <p className="text-[9px] font-semibold mt-1 uppercase opacity-80">
                  {statusLabel(table, meta)}
                </p>
                {meta.waiter && (
                  <p className="text-[9px] mt-1 truncate opacity-90">{meta.waiter}</p>
                )}
                {table.guestCount ? (
                  <p className="text-[9px] opacity-75">{table.guestCount}p</p>
                ) : null}
                {meta.total !== undefined && table.status !== "livre" && (
                  <p className="text-[10px] font-bold mt-0.5 tabular-nums">
                    {formatPrice(meta.total)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
