"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader, SegmentedControl } from "@/components/AppHeader";
import { LogoutButton } from "@/components/LogoutButton";
import { ItemStatusBadge } from "@/components/StatusBadge";
import { dismissKitchenAlert, fetchKitchen, updateItemStatus } from "@/lib/api";
import {
  getKitchenZoneLabel,
  itemMatchesKitchenZone,
  kitchenAlertMatchesZone,
} from "@/lib/kitchen-zones";
import {
  playKitchenAlertSound,
  playNewOrderSound,
} from "@/lib/kitchen-sound";
import { formatWaitTime } from "@/lib/time";
import type { KitchenTicketItem, KitchenZone } from "@/lib/types";
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
type StationFilter = KitchenZone | "todos";

function oldestPrepTime(items: KitchenTicketItem[]): string | null {
  const preparing = items.filter((i) => i.status === "em_preparacao");
  if (preparing.length === 0) return null;

  const oldest = preparing.reduce((min, item) => {
    const at = item.sentToKitchenAt ?? "";
    return !min || (at && at < min) ? at : min;
  }, preparing[0]?.sentToKitchenAt ?? "");

  return formatWaitTime(oldest);
}

function stationItems(
  order: KitchenOrder,
  station: StationFilter
): KitchenTicketItem[] {
  if (station === "todos") return order.items;
  return order.items.filter((item) =>
    itemMatchesKitchenZone(item.kitchenZone, station)
  );
}

function alertForStation(
  order: KitchenOrder,
  station: StationFilter
): boolean {
  if (!order.kitchenAlert) return false;
  if (station === "todos") return true;
  return kitchenAlertMatchesZone(order.kitchenAlert, station);
}

function orderMatchesFilters(
  order: KitchenOrder,
  station: StationFilter,
  status: StatusFilter
): boolean {
  const items = stationItems(order, station);
  const hasAlert = alertForStation(order, station);

  if (status === "ativos") {
    if (items.some((i) => i.status === "em_preparacao")) return true;
    return hasAlert;
  }

  if (status === "prontos") {
    return items.length > 0 && items.every((i) => i.status === "pronto");
  }

  return items.length > 0 || hasAlert;
}

function KitchenItemCard({
  item,
  onStatusChange,
}: {
  item: KitchenTicketItem;
  onStatusChange: (itemId: string, status: string) => void;
}) {
  const itemWait = formatWaitTime(item.sentToKitchenAt);
  const isEntrada = item.kitchenZone === "entradas";

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 ${
        item.status === "pronto"
          ? "bg-green-50 border-2 border-green-300"
          : isEntrada
            ? "bg-amber-50/80 border-2 border-amber-400"
            : "bg-white border-2 border-brand-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          {isEntrada && (
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-amber-900 bg-amber-200 rounded-md px-2 py-0.5 mb-1.5">
              Entrada
            </span>
          )}
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 uppercase leading-tight">
            {item.quantity > 1 && `${item.quantity}× `}
            {item.name}
          </h3>
          {itemWait && item.status === "em_preparacao" && (
            <p className="text-sm font-bold text-amber-800 mt-1">{itemWait}</p>
          )}
        </div>
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
        <div className="flex flex-col gap-2 mt-1">
          <button
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

function KitchenTicket({
  order,
  station,
  onStatusChange,
  onDismissAlert,
}: {
  order: KitchenOrder;
  station: StationFilter;
  onStatusChange: (itemId: string, status: string) => void;
  onDismissAlert: (orderId: string) => void;
}) {
  const items = stationItems(order, station);
  const showAlert = alertForStation(order, station);
  const sentAt = items[0]?.sentToKitchenAt ?? order.items[0]?.sentToKitchenAt;
  const clockTime = sentAt
    ? new Date(sentAt).toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const waitLabel = oldestPrepTime(items);

  const isActive = items.some((i) => i.status === "em_preparacao");
  const isReady =
    items.length > 0 && items.every((i) => i.status === "pronto");

  const entradas = items.filter((i) => i.kitchenZone === "entradas");
  const pratos = items.filter((i) => i.kitchenZone !== "entradas");
  const showZoneHeaders = station === "todos" && entradas.length > 0 && pratos.length > 0;

  return (
    <div
      className={`card ticket flex flex-col ${
        showAlert
          ? "border-red-400 pulse-new bg-red-50/40"
          : isActive
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
          {clockTime && ` · ${clockTime}`}
          {waitLabel && (
            <span className="text-amber-800 font-bold"> · {waitLabel}</span>
          )}
        </p>
      </div>

      {showAlert && order.kitchenAlert && (
        <div className="rounded-xl bg-red-100 border-2 border-red-400 px-4 py-4 mb-4">
          <p className="text-sm font-black uppercase tracking-wide text-red-900 mb-2">
            Alteração no pedido
          </p>
          <p className="text-lg font-bold text-red-950 leading-snug">
            {order.kitchenAlert}
          </p>
          <button
            type="button"
            onClick={() => onDismissAlert(order.orderId)}
            className="btn-secondary w-full mt-4 text-base min-h-[48px]"
          >
            Visto — limpar alerta
          </button>
        </div>
      )}

      <div className="space-y-4">
        {items.length === 0 && showAlert && (
          <p className="text-sm text-brand-muted text-center py-2">
            Sem itens activos nesta secção — ver alerta acima.
          </p>
        )}

        {showZoneHeaders ? (
          <>
            {entradas.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-amber-800 border-b border-amber-200 pb-1">
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
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-brand-muted border-b border-brand-line pb-1">
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
    </div>
  );
}

export default function CozinhaView() {
  const { data: orders, refresh } = usePolling<KitchenOrder[]>(
    fetchKitchen,
    2000
  );
  const [station, setStation] = useState<StationFilter>("todos");
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

  const counts = useMemo(() => {
    const list = orders ?? [];
    const activeEntradas = list.filter((o) =>
      orderMatchesFilters(o, "entradas", "ativos")
    ).length;
    const activePratos = list.filter((o) =>
      orderMatchesFilters(o, "pratos", "ativos")
    ).length;
    const readyCount = list.filter((o) =>
      orderMatchesFilters(o, station, "prontos")
    ).length;
    const activeCount = list.filter((o) =>
      orderMatchesFilters(o, station, "ativos")
    ).length;
    return { activeEntradas, activePratos, readyCount, activeCount };
  }, [orders, station]);

  const filtered = (orders ?? []).filter((order) =>
    orderMatchesFilters(order, station, filter)
  );

  const stationOptions = [
    { id: "entradas", label: `Entradas (${counts.activeEntradas})` },
    { id: "pratos", label: `Pratos (${counts.activePratos})` },
    { id: "todos", label: "Todos" },
  ];

  const filterOptions = [
    { id: "ativos", label: `A preparar (${counts.activeCount})` },
    { id: "prontos", label: `Prontos (${counts.readyCount})` },
    { id: "todos", label: "Todos" },
  ];

  const stationLabel =
    station === "todos" ? "Cozinha" : getKitchenZoneLabel(station);

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <AppHeader
        title={stationLabel}
        subtitle={`${counts.activeCount} a preparar · ${counts.readyCount} prontos`}
        actions={<LogoutButton />}
      />

      <div className="px-3 sm:px-4 py-2 border-b border-brand-gold/10 shrink-0 space-y-2">
        <SegmentedControl
          options={stationOptions}
          active={station}
          onChange={(id) => setStation(id as StationFilter)}
        />
        <SegmentedControl
          options={filterOptions}
          active={filter}
          onChange={(id) => setFilter(id as StatusFilter)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-brand-muted gap-3 p-6">
          <p className="text-sm uppercase tracking-widest font-semibold">
            {stationLabel}
          </p>
          <p className="text-lg sm:text-xl text-center">
            Sem pedidos {filter === "ativos" ? "a preparar" : ""}
          </p>
          <p className="text-sm text-center max-w-xs">
            {station === "entradas"
              ? "Entradas e apetizers aparecem aqui quando enviados"
              : station === "pratos"
                ? "Hambúrgueres, snacks e restantes pratos aparecem aqui"
                : "Os pedidos aparecem quando o empregado envia à cozinha"}
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 max-w-[2000px] mx-auto w-full pb-4">
          {filtered.map((order) => (
            <KitchenTicket
              key={`${order.orderId}-${station}-${order.items.map((i) => i.id).join()}-${order.kitchenAlert ?? ""}`}
              order={order}
              station={station}
              onStatusChange={handleStatusChange}
              onDismissAlert={handleDismissAlert}
            />
          ))}
        </div>
      )}
    </div>
  );
}
