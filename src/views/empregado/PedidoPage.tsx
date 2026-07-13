"use client";

import Link from "next/link";
import { ItemStatusBadge } from "@/components/StatusBadge";
import {
  ScreenBody,
  ScreenFooter,
  ScreenHeader,
  ScreenPage,
} from "@/components/ScreenLayout";
import { formatPrice, isExtraCustomization } from "@/lib/menu";
import type { Order, OrderItem, Table } from "@/lib/types";

interface PedidoPageProps {
  tableNumber: number;
  table?: Table;
  order: Order;
  total: number;
  pendingCount: number;
  loading: boolean;
  onBack: () => void;
  onRemoveItem: (id: string) => void;
  onSendToKitchen: () => void;
  nested?: boolean;
}

function ItemRow({
  item,
  onRemove,
}: {
  item: OrderItem;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-white border border-brand-line p-4 shadow-sm">
      <div className="flex justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-brand-gold text-base">
            {item.quantity > 1 && `${item.quantity}× `}
            {item.name}
          </p>
          {item.customizations
            .filter((c) => !isExtraCustomization(c.groupId))
            .map((c) => (
              <p key={c.groupId} className="text-sm text-brand-muted mt-0.5">
                {c.groupLabel}: {c.optionLabel}
              </p>
            ))}
          {item.customizations
            .filter((c) => isExtraCustomization(c.groupId))
            .map((c) => (
              <p key={c.groupId} className="text-sm text-green-700 mt-0.5">
                + {c.optionLabel}
              </p>
            ))}
          {item.notes && (
            <p className="text-xs text-amber-700 mt-1">Nota: {item.notes}</p>
          )}
          <div className="mt-2">
            {item.skipKitchen ? (
              <span className="badge-livre">Bar</span>
            ) : (
              <ItemStatusBadge status={item.status} />
            )}
          </div>
        </div>
        <p className="font-bold text-brand-gold text-lg shrink-0">
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>
      {item.status === "pendente" && (
        <button
          onClick={() => onRemove(item.id)}
          className="text-sm text-red-400 mt-3 py-1 touch-manipulation"
        >
          Remover
        </button>
      )}
    </div>
  );
}

export function PedidoPage({
  tableNumber,
  order,
  total,
  pendingCount,
  loading,
  onBack,
  onRemoveItem,
  onSendToKitchen,
  nested = false,
}: PedidoPageProps) {
  const items = order.items.filter(
    (i) => i.status !== "cancelado" && !i.isAddon
  );

  return (
    <ScreenPage nested={nested}>
      <ScreenHeader
        title={`Pedido — Mesa ${tableNumber}`}
        subtitle={`${items.length} itens · ${formatPrice(total)}`}
        onBack={onBack}
        backLabel="Menu"
        compact={nested}
      />

      <ScreenBody>
        <div className="p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16 text-brand-muted">
              <p className="text-sm uppercase tracking-widest font-semibold mb-3">
                Pedido
              </p>
              <p>Pedido vazio</p>
              <button onClick={onBack} className="btn-secondary mt-4">
                Ir ao Menu
              </button>
            </div>
          ) : (
            items.map((item) => (
              <ItemRow key={item.id} item={item} onRemove={onRemoveItem} />
            ))
          )}
        </div>
      </ScreenBody>

      {items.length > 0 && (
        <ScreenFooter compact={nested}>
          <div
            className={`flex justify-between font-black text-brand-gold ${
              nested ? "text-xl mb-3" : "text-2xl mb-4"
            }`}
          >
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          {pendingCount > 0 && (
            <button
              onClick={onSendToKitchen}
              disabled={loading}
              className="btn-primary w-full text-base"
            >
              Enviar {pendingCount} à Cozinha
            </button>
          )}
        </ScreenFooter>
      )}
    </ScreenPage>
  );
}

interface MesasPageProps {
  tables: Table[];
  waiterName: string;
  onSetWaiterName: (n: string) => void;
  onSelectTable: (n: number) => void;
  showPortalLink?: boolean;
  portalHref?: string;
  portalLabel?: string;
  namePlaceholder?: string;
  nested?: boolean;
}

export function MesasPage({
  tables,
  waiterName,
  onSetWaiterName,
  onSelectTable,
  showPortalLink = true,
  portalHref = "/sistema",
  portalLabel = "Início",
  namePlaceholder = "O seu nome (empregado)",
  nested = false,
}: MesasPageProps) {
  const occupied = tables.filter((t) => t.status !== "livre").length;

  return (
    <ScreenPage nested={nested}>
      <header
        className={`sticky top-0 z-40 border-b border-brand-line bg-white safe-top shrink-0 ${
          nested ? "px-3 py-2" : "px-4 py-4"
        }`}
      >
        {!nested && (
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-display text-xl font-bold text-brand-gold">
                Mesas
              </h1>
              <p className="text-brand-muted text-xs">
                {occupied} ocupadas · {tables.length} total
              </p>
            </div>
            {showPortalLink && (
              <Link
                href={portalHref}
                className="text-xs text-brand-muted px-3 py-2 rounded-lg border border-brand-gold/15"
              >
                {portalLabel}
              </Link>
            )}
          </div>
        )}
        <input
          className={`input text-sm ${nested ? "!min-h-[40px] !py-2" : ""}`}
          placeholder={namePlaceholder}
          value={waiterName}
          onChange={(e) => onSetWaiterName(e.target.value)}
          autoComplete="name"
        />
        {nested && (
          <p className="text-brand-muted text-[10px] mt-1.5">
            {occupied} ocupadas · {tables.length} mesas
          </p>
        )}
      </header>

      <ScreenBody>
        <div className={nested ? "p-3" : "p-4"}>
          <div className="flex gap-3 mb-3 text-[10px] text-brand-muted">
            <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-white border border-brand-line" />
            Livre
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-50 border-2 border-amber-400" />
            Ocupada
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-orange-50 border-2 border-orange-400" />
              Conta
            </span>
          </div>

          <div className={`grid grid-cols-4 ${nested ? "gap-2" : "gap-3"}`}>
            {tables.map((table) => (
              <button
                key={table.number}
                onClick={() => onSelectTable(table.number)}
                className={`rounded-2xl text-center touch-manipulation active:scale-95 ${
                  nested ? "py-3 min-h-[60px]" : "py-4 min-h-[72px]"
                } ${
                  table.status === "a_pagar"
                    ? "bg-orange-50 border-2 border-orange-400 text-orange-900"
                    : table.status === "ocupada"
                    ? "bg-amber-50 border-2 border-amber-400 text-amber-900"
                    : "bg-white border border-brand-line text-brand-muted shadow-sm"
                }`}
              >
                <span className="text-2xl font-black block">{table.number}</span>
                <span className="text-[10px] font-medium opacity-80">
                  {table.status === "livre"
                    ? "Livre"
                    : table.status === "a_pagar"
                    ? "Conta"
                    : "Ocup."}
                </span>
              </button>
            ))}
          </div>
        </div>
      </ScreenBody>
    </ScreenPage>
  );
}

interface AbrirMesaPageProps {
  tableNumber: number;
  waiterName: string;
  onSetWaiterName?: (n: string) => void;
  guestCount: number;
  onGuestCount: (n: number) => void;
  onBack: () => void;
  onOpen: () => void;
  loading: boolean;
  nested?: boolean;
}

export function AbrirMesaPage({
  tableNumber,
  waiterName,
  onSetWaiterName,
  guestCount,
  onGuestCount,
  onBack,
  onOpen,
  loading,
  nested = false,
}: AbrirMesaPageProps) {
  return (
    <ScreenPage nested={nested}>
      <ScreenHeader
        title={`Mesa ${tableNumber}`}
        subtitle="Mesa livre"
        onBack={onBack}
        backLabel="Mesas"
        compact={nested}
      />

      <ScreenBody className="flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-5 px-4 py-4 w-full">
          <span
            className={`font-black text-brand-gold tabular-nums leading-none ${
              nested ? "text-6xl" : "text-7xl"
            }`}
          >
            {tableNumber}
          </span>
          <p className="text-brand-muted text-center text-base sm:text-lg leading-snug max-w-xs font-medium">
            Confirmar abertura da mesa para começar o pedido
          </p>

          <div className="w-full max-w-md flex flex-col gap-3">
            <div className="w-full min-w-0 rounded-2xl border border-brand-line bg-brand-card px-4 py-3.5 shadow-sm">
              <p className="text-sm text-brand-muted font-semibold mb-2">
                Empregado
              </p>
              {onSetWaiterName ? (
                <input
                  className="input text-lg font-bold !min-h-[48px]"
                  value={waiterName}
                  onChange={(e) => onSetWaiterName(e.target.value)}
                  placeholder="O seu nome"
                  autoComplete="name"
                />
              ) : (
                <p className="text-brand-gold font-bold text-xl sm:text-2xl break-words">
                  {waiterName || "—"}
                </p>
              )}
            </div>

            <div className="w-full min-w-0 flex items-center justify-between gap-4 rounded-2xl border border-brand-line bg-brand-card px-4 py-3.5 shadow-sm">
              <span className="text-base sm:text-lg text-brand-muted font-semibold shrink-0">
                Pessoas
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onGuestCount(Math.max(1, guestCount - 1))}
                  className="flex items-center justify-center min-w-[48px] min-h-[48px] rounded-full bg-brand-surface border border-brand-gold/30 text-brand-gold text-xl touch-manipulation"
                >
                  −
                </button>
                <span className="text-2xl font-black text-brand-gold w-8 text-center tabular-nums">
                  {guestCount}
                </span>
                <button
                  type="button"
                  onClick={() => onGuestCount(Math.min(20, guestCount + 1))}
                  className="flex items-center justify-center min-w-[48px] min-h-[48px] rounded-full bg-brand-surface border border-brand-gold/30 text-brand-gold text-xl touch-manipulation"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </ScreenBody>

      <ScreenFooter compact={nested}>
        <button
          onClick={onOpen}
          disabled={loading || !waiterName.trim()}
          className="btn-primary w-full text-lg py-4 min-h-[56px]"
        >
          Abrir Mesa e Ir ao Menu
        </button>
      </ScreenFooter>
    </ScreenPage>
  );
}
