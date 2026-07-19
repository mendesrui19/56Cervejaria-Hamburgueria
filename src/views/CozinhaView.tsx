"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppHeader, SegmentedControl } from "@/components/AppHeader";
import { StaffLoader } from "@/components/StaffLoader";
import { ItemStatusBadge } from "@/components/StatusBadge";
import { dismissKitchenAlert, fetchKitchen, updateItemStatus } from "@/lib/api";
import { getKitchenZoneLabel } from "@/lib/kitchen-zones";
import {
  playKitchenAlertSound,
  playNewOrderSound,
} from "@/lib/kitchen-sound";
import { formatWaitTime, getWaitTimeLevel, WAIT_TIME_BADGE } from "@/lib/time";
import { isBalcaoTable } from "@/lib/table-labels";
import type { KitchenTicketItem } from "@/lib/types";
import { usePolling } from "@/hooks/usePolling";

interface KitchenOrder {
  orderId: string;
  tableNumber: number;
  waiterName: string;
  items: KitchenTicketItem[];
  createdAt: string;
  kitchenAlert?: string;
  kitchenAlertAt?: string;
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

function KitchenItemCard({
  item,
  onStatusChange,
}: {
  item: KitchenTicketItem;
  onStatusChange: (itemId: string, status: string) => void;
}) {
  const itemWait = formatWaitTime(item.sentToKitchenAt);
  const waitLevel =
    item.status === "em_preparacao"
      ? getWaitTimeLevel(item.sentToKitchenAt)
      : null;
  const isEntrada = item.kitchenZone === "entradas";

  return (
    <div
      className={`staff-ticket-item ${
        item.status === "pronto"
          ? "is-ready"
          : isEntrada
            ? "is-entrada"
            : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {isEntrada && (
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-amber-900 bg-amber-200 rounded-md px-2 py-0.5 mb-1">
              Entrada
            </span>
          )}
          <h3 className="staff-ticket-item-title">
            {item.quantity > 1 && `${item.quantity}× `}
            {item.name}
          </h3>
          {itemWait && item.status === "em_preparacao" && waitLevel && (
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
        <div className="rounded-lg bg-red-50 border border-red-300 px-3 py-2">
          <p className="text-[10px] text-red-800 font-black uppercase tracking-wide">
            Nota
          </p>
          <p className="text-sm text-red-900 font-bold mt-0.5 leading-snug">
            {item.notes}
          </p>
        </div>
      )}

      {item.status === "em_preparacao" && (
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

function KitchenTicket({
  order,
  onStatusChange,
  onDismissAlert,
}: {
  order: KitchenOrder;
  onStatusChange: (itemId: string, status: string) => void;
  onDismissAlert: (orderId: string) => void;
}) {
  const items = order.items;
  const sentAt = items[0]?.sentToKitchenAt;
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
  const hasAlert = Boolean(order.kitchenAlert);

  const entradas = items.filter((i) => i.kitchenZone === "entradas");
  const pratos = items.filter((i) => i.kitchenZone !== "entradas");
  const showZoneHeaders = entradas.length > 0 && pratos.length > 0;

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

      {order.kitchenAlert && (
        <div className="rounded-lg bg-red-100 border border-red-400 px-3 py-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-red-900 mb-1">
            Alteração no pedido
          </p>
          <p className="text-sm font-bold text-red-950 leading-snug">
            {order.kitchenAlert}
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
        {items.length === 0 && order.kitchenAlert && (
          <p className="text-sm text-brand-muted text-center py-1">
            Sem itens activos — apenas alerta.
          </p>
        )}

        {showZoneHeaders ? (
          <>
            {entradas.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-800 border-b border-amber-200 pb-1">
                  {getKitchenZoneLabel("entradas")}
                </p>
                {entradas.map((item) => (
                  <KitchenItemCard
                    key={item.id}
                    item={item}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </div>
            )}
            {pratos.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted border-b border-brand-line pb-1">
                  {getKitchenZoneLabel("pratos")}
                </p>
                {pratos.map((item) => (
                  <KitchenItemCard
                    key={item.id}
                    item={item}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          items.map((item) => (
            <KitchenItemCard
              key={item.id}
              item={item}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </article>
  );
}

export default function CozinhaView() {
  const {
    data: orders,
    loading: ordersLoading,
    refresh,
  } = usePolling<KitchenOrder[]>(fetchKitchen, 2000);
  const [filter, setFilter] = useState<StatusFilter>("ativos");
  const knownItemIds = useRef<Set<string>>(new Set());
  const knownAlerts = useRef<Map<string, string>>(new Map());
  const initialized = useRef(false);

  useEffect(() => {
    if (!orders) return;

    const prepIds = new Set<string>();
    const alerts = new Map<string, string>();

    for (const order of orders) {
      if (order.kitchenAlert) {
        alerts.set(order.orderId, order.kitchenAlert);
      }
      for (const item of order.items) {
        if (item.status === "em_preparacao") {
          prepIds.add(item.id);
        }
      }
    }

    if (!initialized.current) {
      knownItemIds.current = prepIds;
      knownAlerts.current = alerts;
      initialized.current = true;
      return;
    }

    for (const id of prepIds) {
      if (!knownItemIds.current.has(id)) {
        playNewOrderSound();
        break;
      }
    }

    for (const [orderId, message] of alerts) {
      if (knownAlerts.current.get(orderId) !== message) {
        playKitchenAlertSound();
        break;
      }
    }

    knownItemIds.current = prepIds;
    knownAlerts.current = alerts;
  }, [orders]);

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

  const handleDismissAlert = useCallback(
    async (orderId: string) => {
      try {
        await dismissKitchenAlert(orderId);
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
        order.kitchenAlert ||
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
        o.kitchenAlert || o.items.some((i) => i.status === "em_preparacao")
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

  if (!orders && ordersLoading) {
    return <StaffLoader label="A carregar cozinha…" fullScreen />;
  }

  return (
    <div className="staff-shell">
      <AppHeader
        title="Cozinha"
        subtitle={`${activeCount} a preparar · ${readyCount} prontos`}
      />

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
              Cozinha
            </p>
            <p className="text-lg">
              Sem pedidos {filter === "ativos" ? "a preparar" : ""}
            </p>
            <p className="text-sm max-w-xs">
              Os pedidos aparecem quando o empregado envia à cozinha
            </p>
          </div>
        ) : (
          <div className="staff-ticket-rail scrollbar-thin">
            {filtered.map((order) => (
              <KitchenTicket
                key={`${order.orderId}-${order.items.map((i) => i.id).join()}-${order.kitchenAlert ?? ""}`}
                order={order}
                onStatusChange={handleStatusChange}
                onDismissAlert={handleDismissAlert}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
