"use client";

import { useCallback, useState } from "react";
import { AppHeader, SegmentedControl } from "@/components/AppHeader";
import { ItemStatusBadge } from "@/components/StatusBadge";
import { fetchKitchen, updateItemStatus } from "@/lib/api";
import type { KitchenTicketItem } from "@/lib/types";
import { usePolling } from "@/hooks/usePolling";

interface KitchenOrder {
  orderId: string;
  tableNumber: number;
  waiterName: string;
  items: KitchenTicketItem[];
  createdAt: string;
}

function KitchenTicket({
  order,
  onStatusChange,
}: {
  order: KitchenOrder;
  onStatusChange: (itemId: string, status: string) => void;
}) {
  const sentAt = order.items[0]?.sentToKitchenAt;
  const time = sentAt
    ? new Date(sentAt).toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const isActive = order.items.some((i) => i.status === "em_preparacao");
  const isReady = order.items.every((i) => i.status === "pronto");

  return (
    <div
      className={`card ticket flex flex-col ${
        isActive
          ? "border-brand-gold/50 pulse-new"
          : isReady
          ? "border-green-300 opacity-90"
          : ""
      }`}
    >
      <div className="border-b border-brand-line pb-4 mb-4">
        <span className="text-4xl sm:text-5xl font-black text-brand-gold block leading-none">
          MESA {order.tableNumber}
        </span>
        <p className="text-brand-muted text-base sm:text-lg mt-2 font-medium">
          {order.waiterName}
          {time && ` · ${time}`}
        </p>
      </div>

      <div className="space-y-4">
        {order.items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl p-4 sm:p-5 ${
                item.status === "pronto"
                  ? "bg-green-50 border-2 border-green-300"
                  : "bg-white border-2 border-brand-line"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 uppercase leading-tight">
                  {item.quantity > 1 && `${item.quantity}× `}
                  {item.name}
                </h3>
                <ItemStatusBadge status={item.status} size="lg" />
              </div>

              {item.choices.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-brand-muted uppercase tracking-wide mb-2 font-bold">
                    Opções do pedido
                  </p>
                  <ul className="text-lg sm:text-xl space-y-1.5">
                    {item.choices.map((choice, idx) => (
                      <li
                        key={idx}
                        className={
                          choice.startsWith("+")
                            ? "text-emerald-800 font-black"
                            : "text-stone-800 font-bold"
                        }
                      >
                        ► {choice}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {item.notes && (
                <div className="rounded-xl bg-red-50 border-2 border-red-300 px-4 py-3 mb-3">
                  <p className="text-sm text-red-800 font-black uppercase tracking-wide">
                    Nota para a cozinha
                  </p>
                  <p className="text-lg sm:text-xl text-red-900 font-bold mt-1 leading-snug">
                    {item.notes}
                  </p>
                </div>
              )}

              {item.status === "em_preparacao" && (
                <button
                  onClick={() => onStatusChange(item.id, "pronto")}
                  className="btn-primary w-full text-lg sm:text-xl py-4 mt-1 min-h-[56px]"
                >
                  Pronto
                </button>
              )}
              {item.status === "pronto" && (
                <button
                  onClick={() => onStatusChange(item.id, "entregue")}
                  className="btn-secondary w-full text-lg py-4 mt-1 min-h-[56px]"
                >
                  Entregue
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

export default function CozinhaView() {
  const { data: orders, refresh } = usePolling<KitchenOrder[]>(
    fetchKitchen,
    2000
  );
  const [filter, setFilter] = useState<"ativos" | "prontos" | "todos">("ativos");

  const handleStatusChange = useCallback(
    async (itemId: string, status: string) => {
      try {
        await updateItemStatus(itemId, status);
        refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Erro");
      }
    },
    [refresh]
  );

  const filtered = (orders ?? []).filter((order) => {
    if (filter === "ativos")
      return order.items.some((i) => i.status === "em_preparacao");
    if (filter === "prontos")
      return order.items.every((i) => i.status === "pronto");
    return true;
  });

  const activeCount =
    orders?.filter((o) =>
      o.items.some((i) => i.status === "em_preparacao")
    ).length ?? 0;

  const readyCount =
    orders?.filter((o) => o.items.every((i) => i.status === "pronto"))
      .length ?? 0;

  const filterOptions = [
    { id: "ativos", label: `A Preparar (${activeCount})` },
    { id: "prontos", label: `Prontos (${readyCount})` },
    { id: "todos", label: "Todos" },
  ];

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <AppHeader
        title="Cozinha"
        subtitle={`${activeCount} a preparar · ${readyCount} prontos`}
      />

      <div className="px-3 sm:px-4 py-2 border-b border-brand-gold/10 shrink-0">
        <SegmentedControl
          options={filterOptions}
          active={filter}
          onChange={(id) => setFilter(id as typeof filter)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-brand-muted gap-3 p-6">
          <p className="text-sm uppercase tracking-widest font-semibold">
            Cozinha
          </p>
          <p className="text-lg sm:text-xl text-center">
            Sem pedidos {filter === "ativos" ? "a preparar" : ""}
          </p>
          <p className="text-sm text-center max-w-xs">
            Os pedidos aparecem quando o empregado envia à cozinha
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 max-w-[2000px] mx-auto w-full pb-4">
          {filtered.map((order) => (
            <KitchenTicket
              key={`${order.orderId}-${order.items.map((i) => i.id).join()}`}
              order={order}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
