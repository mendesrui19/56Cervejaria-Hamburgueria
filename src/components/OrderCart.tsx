"use client";

import { ItemStatusBadge, TableStatusBadge } from "@/components/StatusBadge";
import { formatPrice } from "@/lib/menu";
import type { Order, OrderItem, Table, TableStatus } from "@/lib/types";

const TABLE_STATUS_SHORT: Record<TableStatus, string> = {
  livre: "Livre",
  ocupada: "Ocup.",
  a_pagar: "Conta",
  fechada: "Fech.",
};

interface TableGridProps {
  tables: Table[];
  selectedTable: number | null;
  onSelect: (n: number) => void;
  columns?: string;
}

export function TableGrid({
  tables,
  selectedTable,
  onSelect,
  columns = "grid-cols-4 sm:grid-cols-3 md:grid-cols-2",
}: TableGridProps) {
  return (
    <div className={`grid ${columns} gap-2.5`}>
      {tables.map((table) => (
        <button
          key={table.number}
          onClick={() => onSelect(table.number)}
          className={`mesa-btn ${
            selectedTable === table.number
              ? "bg-brand-gold text-white font-bold shadow-lg shadow-brand-gold/20"
              : table.status === "a_pagar"
              ? "bg-orange-900/30 border-2 border-orange-600/50 text-orange-200"
              : table.status === "ocupada"
              ? "bg-brand-gold/15 border-2 border-brand-gold/40 text-brand-gold"
              : "bg-brand-card border border-brand-gold/15 text-brand-muted"
          }`}
        >
          <span className="text-xl sm:text-lg font-black block">
            {table.number}
          </span>
          <span className="text-[11px] mt-0.5 block opacity-80 font-medium">
            {TABLE_STATUS_SHORT[table.status]}
          </span>
        </button>
      ))}
    </div>
  );
}

interface OrderCartProps {
  tableNumber: number;
  table?: Table;
  order: Order;
  total: number;
  pendingCount: number;
  loading: boolean;
  onRemoveItem: (id: string) => void;
  onSendToKitchen: () => void;
  onRequestBill: () => void;
}

export function OrderCart({
  tableNumber,
  table,
  order,
  total,
  pendingCount,
  loading,
  onRemoveItem,
  onSendToKitchen,
  onRequestBill,
}: OrderCartProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-brand-gold/15 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-brand-gold text-lg">Mesa {tableNumber}</h3>
          {table && <TableStatusBadge status={table.status} />}
        </div>
        <p className="text-sm text-brand-muted mt-1">
          {order.items.length} itens · {formatPrice(total)}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2.5 min-h-0">
        {order.items.length === 0 ? (
          <p className="text-brand-muted text-sm text-center py-12">
            Pedido vazio — adicione itens no menu
          </p>
        ) : (
          order.items.map((item) => (
            <OrderCartItem
              key={item.id}
              item={item}
              onRemove={onRemoveItem}
            />
          ))
        )}
      </div>

      <div className="p-4 border-t border-brand-gold/15 space-y-2.5 flex-shrink-0 safe-bottom bg-brand-dark/80">
        <div className="flex justify-between text-xl font-bold text-brand-gold">
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

        <button
          onClick={onRequestBill}
          disabled={loading || order.items.length === 0}
          className="btn-secondary w-full"
        >
          Pedir Conta
        </button>
      </div>
    </div>
  );
}

function OrderCartItem({
  item,
  onRemove,
}: {
  item: OrderItem;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="card p-3.5 text-sm">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-brand-gold text-base">
            {item.quantity > 1 && `${item.quantity}× `}
            {item.name}
          </p>
          {item.customizations.map((c) => (
            <p key={c.groupId} className="text-xs text-brand-muted mt-0.5">
              {c.groupLabel}: {c.optionLabel}
            </p>
          ))}
          {item.notes && (
            <p className="text-xs text-yellow-400 mt-1">Nota: {item.notes}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-brand-gold">
            {formatPrice(item.price * item.quantity)}
          </p>
          <ItemStatusBadge status={item.status} />
        </div>
      </div>
      {item.status === "pendente" && (
        <button
          onClick={() => onRemove(item.id)}
          className="text-sm text-red-400 mt-2 py-1 touch-manipulation"
        >
          Remover
        </button>
      )}
    </div>
  );
}
