"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SegmentedControl } from "@/components/AppHeader";
import { ItemStatusBadge } from "@/components/StatusBadge";
import {
  dismissBarAlert,
  fetchBar,
  updateBarItemStatus,
} from "@/lib/api";
import {
  playKitchenAlertSound,
  playNewOrderSound,
} from "@/lib/kitchen-sound";
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
  barAlert?: string;
  barAlertAt?: string;
}

type StatusFilter = "ativos" | "prontos" | "todos";

function oldestPrepTime(items: KitchenTicketItem[]): string | null {
  const preparing = items.filter((i) => i.status === "em_preparacao");
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
  const preparing = item.status === "em_preparacao";
  const itemWait = formatWaitTime(item.sentToKitchenAt);
  const waitLevel = preparing ? getWaitTimeLevel(item.sentToKitchenAt) : null;

  return (
    <div
      className={`staff-ticket-item ${
        item.status === "pronto" ? "is-ready" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="staff-ticket-item-title">
            {item.quantity > 1 && `${item.quantity}× `}
            {item.name}
          </h3>
          {itemWait && preparing && waitLevel && (
            <span
              className={`inline-block mt-1 text-xs font-black px-2 py-0.5 rounded-md border ${WAIT_TIME_BADGE[waitLevel].className}`}
            >
              {itemWait}
            </span>
          )}
        </div>
        <ItemStatusBadge status={item.status} size="lg" />
      </div>

      {item.choices.length > 0 && (
        <div>
          <p className="text-[10px] text-brand-muted uppercase tracking-wide mb-1 font-bold">
            Opções
          </p>
          <ul className="text-sm space-y-1">
            {item.choices.map((choice, idx) => (
              <li key={idx} className="text-stone-800 font-bold">
                ► {choice}
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.notes && (
        <div className="rounded-lg bg-red-50 border border-red-300 px-3 py-2">
          <p className="text-[10px] text-red-800 font-black uppercase tracking-wide">
            Nota
          </p>
          <p className="text-sm text-red-900 font-bold mt-0.5 leading-snug">
            {item.notes}
          </p>
        </div>
      )}

      {preparing && (
        <button
          type="button"
          onClick={() => onStatusChange(item.id, "pronto")}
          className="btn-primary w-full text-base py-3 min-h-[48px]"
        >
          Pronto
        </button>
      )}
      {item.status === "pronto" && (
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => onStatusChange(item.id, "entregue")}
            className="btn-secondary w-full text-base py-3 min-h-[48px]"
          >
            Entregue
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(item.id, "em_preparacao")}
            className="w-full text-xs font-semibold text-brand-muted py-1.5 min-h-[40px]"
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
  onDismissAlert,
}: {
  order: BarOrder;
  onStatusChange: (itemId: string, status: string) => void;
  onDismissAlert: (orderId: string) => void;
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
  const isActive = items.some((i) => i.status === "em_preparacao");
  const waitLevel = isActive ? getWaitTimeLevel(sentAt) : null;
  const isReady =
    items.length > 0 && items.every((i) => i.status === "pronto");
  const hasAlert = Boolean(order.barAlert);

  return (
    <article
      className={`staff-ticket ${
        hasAlert
          ? "is-alert pulse-new"
          : isActive
            ? "is-active pulse-new"
            : isReady
              ? "is-ready"
              : ""
      }`}
    >
      <header className="staff-ticket-head">
        <span className="staff-ticket-mesa">
          {isBalcaoTable(order.tableNumber)
            ? "Balcão"
            : `Mesa ${order.tableNumber}`}
        </span>
        <p className="staff-ticket-meta">
          <span className="truncate">{order.waiterName || "—"}</span>
          {clockTime ? ` · ${clockTime}` : ""}
          {waitLabel && waitLevel ? (
            <span
              className={`inline-block ml-1 px-1.5 py-0.5 rounded border text-[11px] font-bold ${WAIT_TIME_BADGE[waitLevel].className}`}
            >
              {waitLabel}
            </span>
          ) : null}
        </p>
      </header>

      {order.barAlert && (
        <div className="rounded-lg bg-red-100 border border-red-400 px-3 py-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-red-900 mb-1">
            Alteração no bar
          </p>
          <p className="text-sm font-bold text-red-950 leading-snug">
            {order.barAlert}
          </p>
          <button
            type="button"
            onClick={() => onDismissAlert(order.orderId)}
            className="btn-secondary w-full mt-3 text-sm min-h-[44px]"
          >
            Visto — limpar alerta
          </button>
        </div>
      )}

      <div className="staff-ticket-items">
        {items.length === 0 && order.barAlert && (
          <p className="text-sm text-brand-muted text-center py-1">
            Sem bebidas activas — apenas alerta.
          </p>
        )}
        {items.map((item) => (
          <BarItemCard
            key={item.id}
            item={item}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </article>
  );
}

export function CaixaBebidasPanel() {
  const { data: orders, refresh } = usePolling<BarOrder[]>(fetchBar, 2000);
  const [filter, setFilter] = useState<StatusFilter>("ativos");
  const knownItemIds = useRef<Set<string>>(new Set());
  const knownAlerts = useRef<Map<string, string>>(new Map());
  const initialized = useRef(false);

  useEffect(() => {
    if (!orders) return;

    const prepIds = new Set<string>();
    const alerts = new Map<string, string>();
    for (const order of orders) {
      for (const item of order.items) {
        if (item.status === "em_preparacao") {
          prepIds.add(item.id);
        }
      }
      if (order.barAlert) {
        alerts.set(order.orderId, order.barAlert);
      }
    }

    if (!initialized.current) {
      knownItemIds.current = prepIds;
      knownAlerts.current = alerts;
      initialized.current = true;
      return;
    }

    let playedAlert = false;
    for (const [orderId, message] of alerts) {
      if (knownAlerts.current.get(orderId) !== message) {
        playKitchenAlertSound();
        playedAlert = true;
        break;
      }
    }
    if (!playedAlert) {
      for (const id of prepIds) {
        if (!knownItemIds.current.has(id)) {
          playNewOrderSound();
          break;
        }
      }
    }

    knownItemIds.current = prepIds;
    knownAlerts.current = alerts;
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

  const handleDismissAlert = useCallback(
    async (orderId: string) => {
      try {
        await dismissBarAlert(orderId);
        refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Erro");
      }
    },
    [refresh]
  );

  const filtered = (orders ?? []).filter((order) => {
    if (filter === "ativos") {
      return (
        Boolean(order.barAlert) ||
        order.items.some((i) => i.status === "em_preparacao")
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
    orders?.filter(
      (o) =>
        Boolean(o.barAlert) ||
        o.items.some((i) => i.status === "em_preparacao")
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
    <div className="staff-station-body">
      <div className="staff-station-filters">
        <SegmentedControl
          options={filterOptions}
          active={filter}
          onChange={(id) => setFilter(id as StatusFilter)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="staff-station-empty">
          <p className="text-sm uppercase tracking-widest font-semibold">
            Bebidas
          </p>
          <p className="text-lg">
            Sem bebidas {filter === "ativos" ? "a preparar" : ""}
          </p>
          <p className="text-sm max-w-xs">
            As bebidas aparecem quando o empregado as envia ao bar
          </p>
        </div>
      ) : (
        <div className="staff-ticket-rail scrollbar-thin">
          {filtered.map((order) => (
            <BarTicket
              key={`${order.orderId}-${order.items.map((i) => i.id).join()}-${order.barAlert ?? ""}`}
              order={order}
              onStatusChange={handleStatusChange}
              onDismissAlert={handleDismissAlert}
            />
          ))}
        </div>
      )}
    </div>
  );
}
