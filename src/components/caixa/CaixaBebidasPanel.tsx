"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SegmentedControl } from "@/components/AppHeader";
import { ItemStatusBadge } from "@/components/StatusBadge";
import { fetchBar, updateBarItemStatus } from "@/lib/api";
import { playNewOrderSound } from "@/lib/kitchen-sound";
import { formatWaitTime, getWaitTimeLevel, WAIT_TIME_BADGE } from "@/lib/time";
import { isBalcaoTable } from "@/lib/table-labels";
import type { KitchenTicketItem } from "@/lib/types";
import { usePolling } from "@/hooks/usePolling";

interface BarOrder {
  orderId: string;
  tableNumber: number;
  waiterName: string;
  items: KitchenTicketItem[];
  createdAt: string;
}

type StatusFilter = "ativos" | "prontos" | "todos";

function oldestPrepTime(items: KitchenTicketItem[]): string | null {
  const preparing = items.filter(
    (i) => i.status === "em_preparacao" || i.status === "pendente"
  );
  if (preparing.length === 0) return null;

  const oldest = preparing.reduce((min, item) => {
    const at = item.sentToKitchenAt ?? "";
    return !min || (at && at < min) ? at : min;
  }, preparing[0]?.sentToKitchenAt ?? "");

  return formatWaitTime(oldest);
}

function BarItemCard({
  item,
  onStatusChange,
}: {
  item: KitchenTicketItem;
  onStatusChange: (itemId: string, status: string) => void;
}) {
  const preparing =
    item.status === "em_preparacao" || item.status === "pendente";
  const itemWait = formatWaitTime(item.sentToKitchenAt);
  const waitLevel = preparing ? getWaitTimeLevel(item.sentToKitchenAt) : null;

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 ${
        item.status === "pronto"
          ? "bg-green-50 border-2 border-green-300"
          : "bg-white border-2 border-brand-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 uppercase leading-tight">
            {item.quantity > 1 && `${item.quantity}× `}
            {item.name}
          </h3>
          {itemWait && preparing && waitLevel && (
            <span
              className={`inline-block mt-1 text-sm font-black px-2.5 py-1 rounded-lg border ${WAIT_TIME_BADGE[waitLevel].className}`}
            >
              {itemWait}
            </span>
          )}
        </div>
        <ItemStatusBadge
          status={item.status === "pendente" ? "em_preparacao" : item.status}
          size="lg"
        />
      </div>

      {item.choices.length > 0 && (
        <div className="mb-3">
          <p className="text-sm text-brand-muted uppercase tracking-wide mb-2 font-bold">
            Opções
          </p>
          <ul className="text-lg sm:text-xl space-y-1.5">
            {item.choices.map((choice, idx) => (
              <li key={idx} className="text-stone-800 font-bold">
                ► {choice}
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.notes && (
        <div className="rounded-xl bg-red-50 border-2 border-red-300 px-4 py-3 mb-3">
          <p className="text-sm text-red-800 font-black uppercase tracking-wide">
            Nota
          </p>
          <p className="text-lg sm:text-xl text-red-900 font-bold mt-1 leading-snug">
            {item.notes}
          </p>
        </div>
      )}

      {preparing && (
        <button
          type="button"
          onClick={() => onStatusChange(item.id, "pronto")}
          className="btn-primary w-full text-lg sm:text-xl py-4 mt-1 min-h-[56px]"
        >
          Pronto
        </button>
      )}
      {item.status === "pronto" && (
        <div className="flex flex-col gap-2 mt-1">
          <button
            type="button"
            onClick={() => onStatusChange(item.id, "entregue")}
            className="btn-secondary w-full text-lg py-4 min-h-[56px]"
          >
            Entregue
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(item.id, "em_preparacao")}
            className="w-full text-sm font-semibold text-brand-muted py-2 min-h-[44px]"
          >
            Corrigir — voltar a preparar
          </button>
        </div>
      )}
    </div>
  );
}

function BarTicket({
  order,
  onStatusChange,
}: {
  order: BarOrder;
  onStatusChange: (itemId: string, status: string) => void;
}) {
  const items = order.items;
  const sentAt = items[0]?.sentToKitchenAt ?? order.createdAt;
  const clockTime = sentAt
    ? new Date(sentAt).toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const waitLabel = oldestPrepTime(items);
  const isActive = items.some(
    (i) => i.status === "em_preparacao" || i.status === "pendente"
  );
  const waitLevel = isActive ? getWaitTimeLevel(sentAt) : null;
  const isReady =
    items.length > 0 && items.every((i) => i.status === "pronto");

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
          {isBalcaoTable(order.tableNumber)
            ? "BALCÃO"
            : `MESA ${order.tableNumber}`}
        </span>
        <p className="text-brand-muted text-base sm:text-lg mt-2 font-medium">
          {order.waiterName}
          {clockTime && ` · ${clockTime}`}
          {waitLabel && waitLevel && (
            <span
              className={`font-bold ml-1 px-2 py-0.5 rounded-md border ${WAIT_TIME_BADGE[waitLevel].className}`}
            >
              · {waitLabel}
            </span>
          )}
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <BarItemCard
            key={item.id}
            item={item}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}

export function CaixaBebidasPanel() {
  const { data: orders, refresh } = usePolling<BarOrder[]>(fetchBar, 2000);
  const [filter, setFilter] = useState<StatusFilter>("ativos");
  const knownItemIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!orders) return;

    const prepIds = new Set<string>();
    for (const order of orders) {
      for (const item of order.items) {
        if (item.status === "em_preparacao" || item.status === "pendente") {
          prepIds.add(item.id);
        }
      }
    }

    if (!initialized.current) {
      knownItemIds.current = prepIds;
      initialized.current = true;
      return;
    }

    for (const id of prepIds) {
      if (!knownItemIds.current.has(id)) {
        playNewOrderSound();
        break;
      }
    }

    knownItemIds.current = prepIds;
  }, [orders]);

  const handleStatusChange = useCallback(
    async (itemId: string, status: string) => {
      try {
        await updateBarItemStatus(itemId, status);
        refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Erro");
      }
    },
    [refresh]
  );

  const filtered = (orders ?? []).filter((order) => {
    if (filter === "ativos") {
      return order.items.some(
        (i) => i.status === "em_preparacao" || i.status === "pendente"
      );
    }
    if (filter === "prontos") {
      return (
        order.items.length > 0 &&
        order.items.every((i) => i.status === "pronto")
      );
    }
    return true;
  });

  const activeCount =
    orders?.filter((o) =>
      o.items.some((i) => i.status === "em_preparacao" || i.status === "pendente")
    ).length ?? 0;

  const readyCount =
    orders?.filter(
      (o) =>
        o.items.length > 0 && o.items.every((i) => i.status === "pronto")
    ).length ?? 0;

  const filterOptions = [
    { id: "ativos", label: `A Preparar (${activeCount})` },
    { id: "prontos", label: `Prontos (${readyCount})` },
    { id: "todos", label: "Todos" },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="px-3 sm:px-4 py-2 border-b border-brand-gold/10 shrink-0">
        <SegmentedControl
          options={filterOptions}
          active={filter}
          onChange={(id) => setFilter(id as StatusFilter)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-brand-muted gap-3 p-6">
          <p className="text-sm uppercase tracking-widest font-semibold">
            Bebidas
          </p>
          <p className="text-lg sm:text-xl text-center">
            Sem bebidas {filter === "ativos" ? "a preparar" : ""}
          </p>
          <p className="text-sm text-center max-w-xs">
            As bebidas aparecem aqui assim que o empregado as adiciona à mesa
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 max-w-[2000px] mx-auto w-full pb-4">
          {filtered.map((order) => (
            <BarTicket
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
