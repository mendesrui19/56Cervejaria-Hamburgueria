"use client";

import { fetchState } from "@/lib/api";
import type { RestaurantState } from "@/lib/types";
import { usePolling } from "@/hooks/usePolling";

function countKitchenItems(state: RestaurantState): number {
  let count = 0;
  for (const order of state.orders) {
    for (const item of order.items) {
      if (
        item.skipKitchen ||
        item.isAddon ||
        item.status === "cancelado" ||
        item.status === "entregue"
      ) {
        continue;
      }
      if (item.status === "em_preparacao" || item.status === "pronto") {
        count += item.quantity;
      }
    }
  }
  return count;
}

export function AdminLiveBar() {
  const { data: state } = usePolling<RestaurantState>(fetchState, 8000);

  if (!state) return null;

  const occupied = state.tables.filter(
    (t: RestaurantState["tables"][number]) =>
      t.status === "ocupada" || t.status === "a_pagar"
  ).length;
  const toPay = state.tables.filter(
    (t: RestaurantState["tables"][number]) => t.status === "a_pagar"
  ).length;
  const kitchen = countKitchenItems(state);

  return (
    <div className="rounded-2xl border border-emerald-300/40 bg-emerald-50/80 p-4">
      <p className="text-[10px] uppercase tracking-widest text-emerald-800/70 font-bold mb-3">
        Serviço agora
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-2xl font-black text-emerald-900 tabular-nums">
            {occupied}
          </p>
          <p className="text-xs text-emerald-800/80">Mesas activas</p>
        </div>
        <div>
          <p className="text-2xl font-black text-emerald-900 tabular-nums">
            {toPay}
          </p>
          <p className="text-xs text-emerald-800/80">A pagar</p>
        </div>
        <div>
          <p className="text-2xl font-black text-emerald-900 tabular-nums">
            {kitchen}
          </p>
          <p className="text-xs text-emerald-800/80">Cozinha / bar</p>
        </div>
      </div>
    </div>
  );
}
