"use client";

import { formatPrice } from "@/lib/menu";
import type { Order, Table } from "@/lib/types";
import { ItemStatusBadge } from "./StatusBadge";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  tableNumber: number;
  table?: Table;
  order: Order;
  total: number;
  onRemoveItem: (id: string) => void;
  onRequestBill: () => void;
}

export function CartDrawer({
  open,
  onClose,
  tableNumber,
  order,
  total,
  onRemoveItem,
  onRequestBill,
}: CartDrawerProps) {
  if (!open) return null;

  const pending = order.items.filter((i) => i.status === "pendente");

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60">
      <div
        className="flex-1"
        onClick={onClose}
        aria-hidden
      />
      <div className="bg-brand-card border-t border-brand-gold/20 rounded-t-2xl max-h-[75dvh] flex flex-col safe-bottom animate-slide-up">
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-gold/10 shrink-0">
          <div>
            <h3 className="font-bold text-brand-gold text-lg">
              Mesa {tableNumber}
            </h3>
            <p className="text-xs text-brand-muted">
              {order.items.length} itens · {formatPrice(total)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="touch-target rounded-xl text-brand-muted text-xl"
          >
            Fechar
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-thin flex-1 p-3 space-y-2">
          {order.items.length === 0 ? (
            <p className="text-center text-brand-muted py-8 text-sm">
              Pedido vazio
            </p>
          ) : (
            order.items.map((item) => (
              <div key={item.id} className="rounded-xl bg-brand-surface p-3">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand-gold">
                      {item.quantity > 1 && `${item.quantity}× `}
                      {item.name}
                    </p>
                    {item.customizations.map((c) => (
                      <p key={c.groupId} className="text-xs text-brand-muted">
                        {c.optionLabel}
                      </p>
                    ))}
                    <ItemStatusBadge status={item.status} />
                  </div>
                  <p className="font-bold text-brand-gold shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
                {item.status === "pendente" && (
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-xs text-red-400 mt-2 py-1"
                  >
                    Remover
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-brand-gold/10 space-y-2 shrink-0">
          <div className="flex justify-between text-lg font-bold text-brand-gold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          {pending.length > 0 && (
            <p className="text-xs text-yellow-400 text-center">
              {pending.length} item{pending.length > 1 ? "s" : ""} por enviar
            </p>
          )}
          <button onClick={onRequestBill} className="btn-secondary w-full">
            Pedir Conta
          </button>
        </div>
      </div>
    </div>
  );
}

interface FastActionBarProps {
  itemCount: number;
  total: number;
  pendingCount: number;
  loading: boolean;
  onOpenCart: () => void;
  onSend: () => void;
}

export function FastActionBar({
  itemCount,
  total,
  pendingCount,
  loading,
  onOpenCart,
  onSend,
}: FastActionBarProps) {
  return (
    <div className="fixed bottom-[56px] inset-x-0 z-30 px-3 pb-2 xl:static xl:px-0 xl:pb-0 xl:border-t xl:border-brand-gold/15 xl:bg-brand-dark/90">
      <div className="flex gap-2 items-stretch">
        <button
          onClick={onOpenCart}
          className="flex-1 rounded-xl bg-brand-card border border-brand-gold/25 px-3 py-2.5 text-left touch-manipulation min-h-[52px] active:bg-brand-surface"
        >
          <p className="text-[10px] text-brand-muted uppercase tracking-wide">
            Pedido
          </p>
          <p className="text-brand-gold font-bold text-sm leading-tight">
            {itemCount} · {formatPrice(total)}
          </p>
        </button>

        {pendingCount > 0 ? (
          <button
            onClick={onSend}
            disabled={loading}
            className="flex-[1.4] btn-primary text-sm font-bold px-3 min-h-[52px]"
          >
            ENVIAR {pendingCount}
          </button>
        ) : (
          <button
            onClick={onOpenCart}
            className="flex-[1.4] btn-secondary text-sm min-h-[52px]"
          >
            Ver pedido
          </button>
        )}
      </div>
    </div>
  );
}
