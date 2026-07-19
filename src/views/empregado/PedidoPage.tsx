"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ItemStatusBadge } from "@/components/StatusBadge";
import {
  ScreenBody,
  ScreenFooter,
  ScreenHeader,
  ScreenPage,
} from "@/components/ScreenLayout";
import { formatPrice, isExtraCustomization } from "@/lib/menu";
import {
  isBalcaoTable,
  tableFullLabel,
  tableShortLabel,
} from "@/lib/table-labels";
import { BALCAO_TABLE_NUMBER } from "@/lib/validators";
import type { MenuItem, Order, OrderItem, Table } from "@/lib/types";

interface PedidoPageProps {
  tableNumber: number;
  table?: Table;
  order: Order;
  total: number;
  pendingCount: number;
  loading: boolean;
  menuItems: MenuItem[];
  onBack: () => void;
  onRemoveItem: (id: string) => void;
  onCancelItem: (id: string) => void;
  onEditItem: (item: OrderItem) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onSendToKitchen: (itemIds?: string[]) => void;
  onTableActions: () => void;
  onRequestBill: () => void;
  onReopenRound: () => void;
  nested?: boolean;
}

function ItemRow({
  item,
  menuItems,
  onRemove,
  onCancel,
  onEdit,
  onUpdateQuantity,
  selectable,
  selected,
  onToggleSelect,
}: {
  item: OrderItem;
  menuItems: MenuItem[];
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
  onEdit: (item: OrderItem) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const menuItem = menuItems.find((entry) => entry.id === item.menuItemId);
  const isPending = item.status === "pendente";
  const inPreparation = item.status === "em_preparacao";
  const isReady = item.status === "pronto";
  const canEdit =
    isPending || (inPreparation && Boolean(menuItem));
  const canCancelSent = inPreparation;

  return (
    <div
      className={`rounded-2xl bg-white border p-4 shadow-sm ${
        selected ? "border-brand-gold ring-2 ring-brand-gold/30" : "border-brand-line"
      }`}
    >
      <div className="flex justify-between gap-3">
        <div className="flex-1 min-w-0">
          {selectable && (
            <button
              type="button"
              onClick={onToggleSelect}
              className="mb-2 text-xs font-bold text-brand-gold touch-manipulation"
            >
              {selected ? "✓ Seleccionado para enviar" : "Seleccionar para enviar"}
            </button>
          )}
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
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {item.skipKitchen ? (
              <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200">
                Bar
              </span>
            ) : null}
            <ItemStatusBadge status={item.status} />
          </div>
        </div>
        <p className="font-bold text-brand-gold text-lg shrink-0">
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>

      {isPending && (
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs text-brand-muted font-semibold">Qtd</span>
          <button
            type="button"
            onClick={() =>
              onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
            }
            className="min-w-[36px] min-h-[36px] rounded-full border border-brand-line text-brand-gold"
          >
            −
          </button>
          <span className="font-black text-brand-gold tabular-nums">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() =>
              onUpdateQuantity(item.id, Math.min(20, item.quantity + 1))
            }
            className="min-w-[36px] min-h-[36px] rounded-full border border-brand-line text-brand-gold"
          >
            +
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-3">
        {isPending && (
          <button
            onClick={() => onRemove(item.id)}
            className="text-sm text-red-500 py-1 touch-manipulation"
          >
            Remover
          </button>
        )}
        {canEdit && (
          <button
            onClick={() => onEdit(item)}
            className="text-sm text-brand-gold font-semibold py-1 touch-manipulation"
          >
            Editar
          </button>
        )}
        {canCancelSent && (
          <button
            onClick={() => onCancel(item.id)}
            className="text-sm text-red-600 font-semibold py-1 touch-manipulation"
          >
            {item.skipKitchen ? "Cancelar bebida" : "Cancelar prato"}
          </button>
        )}
        {isReady && (
          <p className="text-xs text-brand-muted w-full">
            Já pronto {item.skipKitchen ? "no bar" : "na cozinha"} — não é
            possível alterar daqui.
          </p>
        )}
      </div>
    </div>
  );
}

export function PedidoPage({
  tableNumber,
  table,
  order,
  total,
  pendingCount,
  loading,
  menuItems,
  onBack,
  onRemoveItem,
  onCancelItem,
  onEditItem,
  onUpdateQuantity,
  onSendToKitchen,
  onTableActions,
  onRequestBill,
  onReopenRound,
  nested = false,
}: PedidoPageProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const billRequested = table?.status === "a_pagar";
  const label = tableFullLabel(tableNumber);

  const items = order.items.filter(
    (i) => i.status !== "cancelado" && !i.isAddon
  );

  const pendingItems = useMemo(
    () => items.filter((item) => item.status === "pendente"),
    [items]
  );

  const selectedPending = pendingItems.filter((item) =>
    selectedIds.has(item.id)
  );

  const pendingFood = pendingItems.filter((item) => !item.skipKitchen).length;
  const pendingDrinks = pendingItems.filter((item) => item.skipKitchen).length;

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllPending() {
    setSelectedIds(new Set(pendingItems.map((item) => item.id)));
  }

  function sendButtonLabel(count: number) {
    if (pendingFood > 0 && pendingDrinks > 0) {
      return `Enviar ${count} (cozinha e bar)`;
    }
    if (pendingDrinks > 0 && pendingFood === 0) {
      return `Enviar ${count} ao bar`;
    }
    return `Enviar ${count} à cozinha`;
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleSendSelected() {
    if (selectedPending.length === 0) return;
    onSendToKitchen(selectedPending.map((item) => item.id));
    setSelectedIds(new Set());
  }

  return (
    <ScreenPage nested={nested}>
      <ScreenHeader
        title={`Pedido — ${label}`}
        subtitle={`${items.length} itens · ${formatPrice(total)}`}
        onBack={onBack}
        backLabel="Menu"
        compact={nested}
        showLogout={!nested}
        action={
          <button
            type="button"
            onClick={onTableActions}
            className="text-xs font-semibold text-brand-gold px-3 py-2 rounded-xl border border-brand-gold/25"
          >
            {isBalcaoTable(tableNumber) ? "Opções" : "Mesa"}
          </button>
        }
      />

      {billRequested && (
        <div className="mx-4 mt-3 rounded-xl bg-orange-50 border border-orange-300 px-4 py-3 text-orange-950 text-sm">
          <p className="font-semibold">
            Conta pedida — à espera da caixa. Podes ainda adicionar bebidas.
          </p>
          <p className="text-xs mt-1 text-orange-900/80">
            Para comida nova, inicia uma nova ronda (a mesa deixa de estar «a
            pagar» até pedires a conta outra vez).
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={onReopenRound}
            className="mt-2.5 w-full min-h-[44px] rounded-xl border border-sky-400 bg-sky-50 text-sky-950 font-bold touch-manipulation"
          >
            Nova ronda
          </button>
        </div>
      )}
      {order.kitchenAlert && (
        <div className="mx-4 mt-3 rounded-xl bg-amber-50 border border-amber-300 px-4 py-3 text-amber-950 text-sm">
          <p className="font-bold uppercase tracking-wide text-xs mb-1">
            Alerta cozinha activo
          </p>
          <p>{order.kitchenAlert}</p>
        </div>
      )}
      {order.barAlert && (
        <div className="mx-4 mt-3 rounded-xl bg-emerald-50 border border-emerald-300 px-4 py-3 text-emerald-950 text-sm">
          <p className="font-bold uppercase tracking-wide text-xs mb-1">
            Alerta bar activo
          </p>
          <p>{order.barAlert}</p>
        </div>
      )}

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
            <>
              {pendingItems.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-1">
                  <button
                    type="button"
                    onClick={selectAllPending}
                    className="text-xs font-semibold text-brand-gold"
                  >
                    Seleccionar todos pendentes
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs font-semibold text-brand-muted"
                    >
                      Limpar selecção
                    </button>
                  )}
                </div>
              )}
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  menuItems={menuItems}
                  onRemove={onRemoveItem}
                  onCancel={onCancelItem}
                  onEdit={onEditItem}
                  onUpdateQuantity={onUpdateQuantity}
                  selectable={item.status === "pendente"}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={() => toggleItem(item.id)}
                />
              ))}
            </>
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
            <div className="space-y-2">
              <p className="text-[11px] text-brand-muted text-center leading-snug">
                Pendente = ainda podes alterar. Só vai ao destino depois de
                enviares.
              </p>
              {selectedPending.length > 0 && (
                <button
                  onClick={handleSendSelected}
                  disabled={loading}
                  className="btn-secondary w-full text-base"
                >
                  Enviar {selectedPending.length} seleccionado
                  {selectedPending.length > 1 ? "s" : ""}
                </button>
              )}
              <button
                onClick={() => onSendToKitchen()}
                disabled={loading}
                className="btn-primary w-full text-base"
              >
                {sendButtonLabel(pendingCount)}
              </button>
            </div>
          )}

          {!billRequested && (
            <button
              type="button"
              onClick={onRequestBill}
              disabled={loading}
              className={`w-full text-base font-bold rounded-xl border-2 border-orange-400 bg-orange-50 text-orange-950 min-h-[48px] touch-manipulation ${
                pendingCount > 0 ? "mt-2" : ""
              }`}
            >
              Pedir conta
            </button>
          )}
        </ScreenFooter>
      )}
    </ScreenPage>
  );
}

interface MesaActionsPageProps {
  tableNumber: number;
  tables: Table[];
  guestCount?: number;
  loading: boolean;
  onBack: () => void;
  onTransfer: (toTableNumber: number) => void;
  onMerge: (withTableNumber: number) => void;
  onGuestCountChange: (count: number) => void;
  onRequestBill: () => void;
  onReopenRound: () => void;
  onClearTable: () => void;
  billRequested?: boolean;
  nested?: boolean;
}

export function MesaActionsPage({
  tableNumber,
  tables,
  guestCount = 2,
  loading,
  onBack,
  onTransfer,
  onMerge,
  onGuestCountChange,
  onRequestBill,
  onReopenRound,
  onClearTable,
  billRequested = false,
  nested = false,
}: MesaActionsPageProps) {
  const freeTables = tables.filter(
    (table) => table.status === "livre" && table.number !== tableNumber
  );
  const occupiedTables = tables.filter(
    (table) =>
      table.status !== "livre" &&
      table.number !== tableNumber &&
      table.orderId
  );
  const balcao = isBalcaoTable(tableNumber);

  return (
    <ScreenPage nested={nested}>
      <ScreenHeader
        title={tableFullLabel(tableNumber)}
        subtitle="Conta, transferir ou fechar"
        onBack={onBack}
        backLabel="Pedido"
        compact={nested}
        showLogout={!nested}
      />

      <ScreenBody>
        <div className="p-4 space-y-6">
          <section className="space-y-2">
            {!billRequested ? (
              <button
                type="button"
                disabled={loading}
                onClick={onRequestBill}
                className="w-full min-h-[52px] rounded-xl border-2 border-orange-400 bg-orange-50 text-orange-950 font-bold touch-manipulation"
              >
                Pedir conta
              </button>
            ) : (
              <div className="space-y-2">
                <div className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-950">
                  Conta já pedida — a caixa já vê este pedido. Bebidas ainda
                  podem ser adicionadas.
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={onReopenRound}
                  className="w-full min-h-[48px] rounded-xl border-2 border-sky-400 bg-sky-50 text-sky-950 font-bold touch-manipulation"
                >
                  Nova ronda (voltar a servir)
                </button>
              </div>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={onClearTable}
              className="w-full min-h-[48px] rounded-xl border border-red-200 bg-red-50 text-red-800 font-semibold touch-manipulation"
            >
              Fechar sem pagar (erro)
            </button>
            <p className="text-xs text-brand-muted">
              Usa só se abriste por engano ou a conta está vazia. Não funciona se
              já houver pratos prontos/entregues.
            </p>
          </section>

          {!balcao && (
          <section>
            <h2 className="text-sm font-bold text-brand-gold mb-2">
              Nº de pessoas
            </h2>
            <div className="flex items-center justify-between rounded-2xl border border-brand-line bg-white px-4 py-3">
              <span className="text-sm text-brand-muted font-semibold">
                Pessoas na mesa
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onGuestCountChange(Math.max(1, guestCount - 1))}
                  className="min-w-[44px] min-h-[44px] rounded-full border border-brand-line text-brand-gold"
                >
                  −
                </button>
                <span className="text-2xl font-black text-brand-gold w-8 text-center tabular-nums">
                  {guestCount}
                </span>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onGuestCountChange(Math.min(20, guestCount + 1))}
                  className="min-w-[44px] min-h-[44px] rounded-full border border-brand-line text-brand-gold"
                >
                  +
                </button>
              </div>
            </div>
          </section>
          )}

          <section>
            <h2 className="text-sm font-bold text-brand-gold mb-2">
              Transferir para mesa livre
            </h2>
            <p className="text-sm text-brand-muted mb-3">
              Move todo o pedido desta mesa para outra mesa vazia.
            </p>
            {freeTables.length === 0 ? (
              <p className="text-sm text-brand-muted">Sem mesas livres.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {freeTables.map((table) => (
                  <button
                    key={table.number}
                    type="button"
                    disabled={loading}
                    onClick={() => onTransfer(table.number)}
                    className="rounded-xl border border-brand-line py-3 font-black text-brand-gold touch-manipulation"
                  >
                    {isBalcaoTable(table.number) ? "B" : table.number}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-bold text-brand-gold mb-2">
              Juntar com outra mesa
            </h2>
            <p className="text-sm text-brand-muted mb-3">
              Une o pedido de outra mesa ocupada a esta conta.
            </p>
            {occupiedTables.length === 0 ? (
              <p className="text-sm text-brand-muted">
                Sem outras mesas ocupadas.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {occupiedTables.map((table) => (
                  <button
                    key={table.number}
                    type="button"
                    disabled={loading}
                    onClick={() => onMerge(table.number)}
                    className="rounded-xl border-2 border-amber-400 bg-amber-50 py-3 font-black text-amber-900 touch-manipulation"
                  >
                    {isBalcaoTable(table.number) ? "B" : table.number}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </ScreenBody>
    </ScreenPage>
  );
}

interface MesasPageProps {
  tables: Table[];
  orders?: Order[];
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
  orders = [],
  waiterName,
  onSetWaiterName,
  onSelectTable,
  showPortalLink = true,
  portalHref = "/sistema",
  portalLabel = "Sistema",
  namePlaceholder = "O seu nome (empregado)",
  nested = false,
}: MesasPageProps) {
  const diningTables = tables.filter((t) => !isBalcaoTable(t.number));
  const balcaoTable = tables.find((t) => isBalcaoTable(t.number));
  const occupied = tables.filter((t) => t.status !== "livre").length;

  function tableHasAlert(table: Table) {
    if (!table.orderId) return false;
    const order = orders.find((entry) => entry.id === table.orderId);
    return Boolean(order?.kitchenAlert || order?.barAlert);
  }

  function tableReadyCount(table: Table): number {
    if (!table.orderId) return 0;
    const order = orders.find((entry) => entry.id === table.orderId);
    if (!order) return 0;
    return order.items
      .filter((item) => !item.isAddon && item.status === "pronto")
      .reduce((sum, item) => sum + item.quantity, 0);
  }

  function tableReadyHint(table: Table): string | null {
    if (!table.orderId) return null;
    const order = orders.find((entry) => entry.id === table.orderId);
    if (!order) return null;
    const ready = order.items.filter(
      (item) => !item.isAddon && item.status === "pronto"
    );
    if (ready.length === 0) return null;
    const food = ready
      .filter((i) => !i.skipKitchen)
      .reduce((s, i) => s + i.quantity, 0);
    const drinks = ready
      .filter((i) => i.skipKitchen)
      .reduce((s, i) => s + i.quantity, 0);
    const parts: string[] = [];
    if (food > 0) parts.push(`${food} comida`);
    if (drinks > 0) parts.push(`${drinks} bebida${drinks > 1 ? "s" : ""}`);
    return parts.join(" · ") || `${ready.reduce((s, i) => s + i.quantity, 0)} prontos`;
  }

  return (
    <ScreenPage nested={nested}>
      {!nested ? (
        <AppHeader
          title="Empregado"
          subtitle={`${occupied} ocupadas · ${tables.length} mesas`}
          hubHref={showPortalLink ? portalHref : "/sistema"}
          hubLabel={showPortalLink ? portalLabel : "Sistema"}
        />
      ) : null}
      <div
        className={`shrink-0 border-b border-brand-line bg-white ${
          nested ? "px-3 py-2" : "px-3 sm:px-4 py-3"
        }`}
      >
        <input
          className={`input text-sm ${nested ? "!min-h-[40px] !py-2" : ""}`}
          placeholder={namePlaceholder}
          value={waiterName}
          onChange={(e) => onSetWaiterName(e.target.value)}
          autoComplete="name"
        />
        {nested ? (
          <p className="text-brand-muted text-[10px] mt-1.5">
            {occupied} ocupadas · {tables.length} mesas
          </p>
        ) : null}
      </div>

      <ScreenBody>
        <div className={nested ? "p-3" : "p-4"}>
          <div className="flex gap-3 mb-3 text-[10px] text-brand-muted flex-wrap">
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
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-50 border-2 border-green-400" />
              Prontos
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-100 border-2 border-red-400" />
              Alerta
            </span>
          </div>

          <div className={`grid grid-cols-4 ${nested ? "gap-2" : "gap-3"}`}>
            {diningTables.map((table) => {
              const readyCount = tableReadyCount(table);
              const readyHint = tableReadyHint(table);
              const hasAlert = tableHasAlert(table);

              return (
                <button
                  key={table.number}
                  onClick={() => onSelectTable(table.number)}
                  className={`rounded-2xl text-center touch-manipulation active:scale-95 ${
                    nested ? "py-3 min-h-[60px]" : "py-4 min-h-[72px]"
                  } ${
                    hasAlert
                      ? "bg-red-50 border-2 border-red-400 text-red-900"
                      : readyCount > 0
                      ? "bg-green-50 border-2 border-green-500 text-green-950 shadow-[0_0_0_3px_rgba(34,197,94,0.25)]"
                      : table.status === "a_pagar"
                      ? "bg-orange-50 border-2 border-orange-400 text-orange-900"
                      : table.status === "ocupada"
                      ? "bg-amber-50 border-2 border-amber-400 text-amber-900"
                      : "bg-white border border-brand-line text-brand-muted shadow-sm"
                  }`}
                >
                  <span className="text-2xl font-black block">
                    {tableShortLabel(table.number)}
                  </span>
                  <span className="text-[10px] font-medium opacity-80 px-0.5 leading-tight block">
                    {hasAlert
                      ? "Alerta"
                      : readyHint
                        ? readyHint
                        : table.status === "livre"
                          ? "Livre"
                          : table.status === "a_pagar"
                            ? "Conta"
                            : "Ocup."}
                  </span>
                </button>
              );
            })}
          </div>

          {balcaoTable && (
            <button
              type="button"
              onClick={() => onSelectTable(BALCAO_TABLE_NUMBER)}
              className={`mt-3 w-full rounded-2xl text-left touch-manipulation active:scale-[0.99] px-4 ${
                nested ? "py-3 min-h-[56px]" : "py-4 min-h-[64px]"
              } ${
                tableHasAlert(balcaoTable)
                  ? "bg-red-50 border-2 border-red-400 text-red-900"
                  : tableReadyCount(balcaoTable) > 0
                  ? "bg-green-50 border-2 border-green-500 text-green-950 shadow-[0_0_0_3px_rgba(34,197,94,0.25)]"
                  : balcaoTable.status === "a_pagar"
                  ? "bg-orange-50 border-2 border-orange-400 text-orange-900"
                  : balcaoTable.status === "ocupada"
                  ? "bg-amber-50 border-2 border-amber-400 text-amber-900"
                  : "bg-white border border-brand-line text-brand-muted shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-black leading-none">Balcão</p>
                  <p className="text-[11px] font-medium opacity-80 mt-1">
                    {tableReadyHint(balcaoTable) ?? "Takeaway / sem mesa"}
                  </p>
                </div>
                <span className="text-xs font-bold uppercase tracking-wide opacity-80">
                  {tableReadyCount(balcaoTable) > 0
                    ? "Prontos"
                    : balcaoTable.status === "livre"
                    ? "Livre"
                    : balcaoTable.status === "a_pagar"
                    ? "Conta"
                    : "Aberto"}
                </span>
              </div>
            </button>
          )}
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
  const balcao = isBalcaoTable(tableNumber);

  return (
    <ScreenPage nested={nested}>
      <ScreenHeader
        title={tableFullLabel(tableNumber)}
        subtitle={balcao ? "Takeaway / sem mesa" : "Mesa livre"}
        onBack={onBack}
        backLabel="Mesas"
        compact={nested}
        showLogout={!nested}
      />

      <ScreenBody className="flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-5 px-4 py-4 w-full">
          <span
            className={`font-black text-brand-gold tabular-nums leading-none ${
              nested ? "text-6xl" : "text-7xl"
            }`}
          >
            {balcao ? "B" : tableNumber}
          </span>
          <p className="text-brand-muted text-center text-base sm:text-lg leading-snug max-w-xs font-medium">
            {balcao
              ? "Abrir pedido de balcão / takeaway"
              : "Confirmar abertura da mesa para começar o pedido"}
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

            {!balcao && (
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
            )}
          </div>
        </div>
      </ScreenBody>

      <ScreenFooter compact={nested}>
        <button
          onClick={onOpen}
          disabled={loading || !waiterName.trim()}
          className="btn-primary w-full text-lg py-4 min-h-[56px]"
        >
          {balcao ? "Abrir Balcão e Ir ao Menu" : "Abrir Mesa e Ir ao Menu"}
        </button>
      </ScreenFooter>
    </ScreenPage>
  );
}
