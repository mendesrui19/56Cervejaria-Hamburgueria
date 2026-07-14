"use client";

import { fetchState } from "@/lib/api";
import { formatPrice } from "@/lib/menu";
import type { Order, RestaurantState, Table } from "@/lib/types";
import { calculateOrderTotal } from "@/lib/utils";
import { usePolling } from "@/hooks/usePolling";

function tableMeta(
  table: Table,
  orders: Order[]
): { waiter?: string; total?: number; readyCount: number; hasAlert: boolean } {
  if (!table.orderId) {
    return { readyCount: 0, hasAlert: false };
  }

  const order = orders.find((entry) => entry.id === table.orderId);
  if (!order) return { readyCount: 0, hasAlert: false };

  const readyCount = order.items
    .filter(
      (item) =>
        !item.isAddon && !item.skipKitchen && item.status === "pronto"
    )
    .reduce((sum, item) => sum + item.quantity, 0);

  return {
    waiter: order.waiterName,
    total: calculateOrderTotal(order),
    readyCount,
    hasAlert: Boolean(order.kitchenAlert),
  };
}

function tableClass(table: Table, meta: ReturnType<typeof tableMeta>) {
  if (meta.hasAlert) {
    return "bg-red-50 border-2 border-red-400 text-red-900";
  }
  if (meta.readyCount > 0) {
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

export function AdminTableMap() {
  const { data: state } = usePolling<RestaurantState>(fetchState, 5000);

  if (!state) {
    return (
      <div className="card text-brand-muted text-sm text-center py-8">
        A carregar mapa de mesas…
      </div>
    );
  }

  const occupied = state.tables.filter((t) => t.status !== "livre").length;
  const openTotal = state.orders.reduce(
    (sum, order) => sum + calculateOrderTotal(order),
    0
  );

  return (
    <div className="card mb-6 border-brand-gold/20">
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
            {occupied} ocupadas · {formatPrice(openTotal)} em aberto
          </p>
        </div>
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
                {meta.hasAlert
                  ? "Alerta"
                  : meta.readyCount > 0
                    ? `${meta.readyCount} prontos`
                    : table.status === "livre"
                      ? "Livre"
                      : table.status === "a_pagar"
                        ? "Conta"
                        : "Ocupada"}
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
  );
}
