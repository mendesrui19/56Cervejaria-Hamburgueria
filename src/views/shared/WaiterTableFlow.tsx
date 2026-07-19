"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AddToast } from "@/components/AddToast";
import { StaffLoader } from "@/components/StaffLoader";
import { playReadyForPickupSound } from "@/lib/kitchen-sound";
import {
  ScreenBody,
  ScreenFooter,
  ScreenHeader,
  ScreenPage,
} from "@/components/ScreenLayout";
import {
  addDiningTable,
  addItem,
  cancelItem,
  clearTable,
  fetchState,
  mergeTables,
  openTable,
  removeItem,
  reopenTableRound,
  requestBill,
  sendToKitchen,
  transferTable,
  updateGuestCount,
  updateOrderItem,
} from "@/lib/api";
import {
  getDefaultCustomizations,
  needsCustomization,
  formatPrice,
} from "@/lib/menu";
import { isBalcaoTable, tableFullLabel } from "@/lib/table-labels";
import { calculateOrderTotal } from "@/lib/utils";
import type { MenuItem, OrderItem, RestaurantState } from "@/lib/types";
import { usePolling } from "@/hooks/usePolling";
import { useMenu } from "@/hooks/useMenu";
import { MenuGrid } from "@/views/empregado/MenuGrid";
import {
  AbrirMesaPage,
  MesaActionsPage,
  MesasPage,
  PedidoPage,
} from "@/views/empregado/PedidoPage";
import { PersonalizarPage } from "@/views/empregado/PersonalizarPage";

type Screen =
  | "mesas"
  | "abrir"
  | "menu"
  | "pedido"
  | "personalizar"
  | "mesa-acoes"
  | "editar";

interface WaiterTableFlowProps {
  showPortalLink?: boolean;
  portalHref?: string;
  portalLabel?: string;
  namePlaceholder?: string;
  nameStorageKey?: string;
  nested?: boolean;
}

export function WaiterTableFlow({
  showPortalLink = true,
  portalHref = "/sistema",
  portalLabel = "Início",
  namePlaceholder = "O seu nome (empregado)",
  nameStorageKey = "waiterName",
  nested = false,
}: WaiterTableFlowProps) {
  const {
    data: state,
    loading: stateLoading,
    refresh,
  } = usePolling<RestaurantState>(fetchState, 3000);
  const {
    categories,
    items: menuItems,
    addons,
    loading: menuLoading,
    error: menuError,
  } = useMenu();

  const [screen, setScreen] = useState<Screen>("mesas");
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [customizeItem, setCustomizeItem] = useState<MenuItem | null>(null);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [waiterName, setWaiterName] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [addingTable, setAddingTable] = useState(false);
  const knownReadyIds = useRef<Set<string>>(new Set());
  const readySoundReady = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(nameStorageKey);
    if (saved) setWaiterName(saved);
  }, [nameStorageKey]);

  useEffect(() => {
    if (waiterName) localStorage.setItem(nameStorageKey, waiterName);
  }, [waiterName, nameStorageKey]);

  useEffect(() => {
    if (!state) return;

    const readyIds = new Set<string>();
    for (const order of state.orders) {
      if (order.paidAt) continue;
      const table = state.tables.find((t) => t.orderId === order.id);
      if (!table) continue;
      for (const item of order.items) {
        if (!item.isAddon && item.status === "pronto") {
          readyIds.add(item.id);
        }
      }
    }

    if (!readySoundReady.current) {
      knownReadyIds.current = readyIds;
      readySoundReady.current = true;
      return;
    }

    for (const id of readyIds) {
      if (!knownReadyIds.current.has(id)) {
        playReadyForPickupSound();
        break;
      }
    }
    knownReadyIds.current = readyIds;
  }, [state]);

  const currentOrder = state?.orders.find(
    (o) =>
      o.tableNumber === selectedTable &&
      !o.paidAt &&
      state.tables.find((t) => t.number === selectedTable)?.orderId === o.id
  );

  const currentTable = state?.tables.find((t) => t.number === selectedTable);
  const total = currentOrder ? calculateOrderTotal(currentOrder) : 0;
  const pendingCount =
    currentOrder?.items.filter(
      (i) => !i.isAddon && i.status === "pendente"
    ).length ?? 0;
  const itemCount =
    currentOrder?.items.filter((i) => !i.isAddon).length ?? 0;

  const goMesas = useCallback(() => {
    setScreen("mesas");
    setCustomizeItem(null);
    setEditingItem(null);
  }, []);

  const handleSelectTable = useCallback(
    (n: number) => {
      if (!waiterName.trim()) {
        setError("Escreve o teu nome antes de selecionar uma mesa.");
        return;
      }
      setError("");
      setSelectedTable(n);
      const table = state?.tables.find((t) => t.number === n);
      const hasActiveOrder = state?.orders.some(
        (o) =>
          o.tableNumber === n &&
          !o.paidAt &&
          table?.orderId === o.id
      );

      if (hasActiveOrder) {
        const tableGuest = state?.tables.find((t) => t.number === n)?.guestCount;
        if (tableGuest) setGuestCount(tableGuest);
        setScreen("menu");
      } else if (table?.status === "livre") {
        setScreen("abrir");
      } else {
        setError("Mesa sem pedido activo. Volta a tentar ou escolhe outra mesa.");
        setSelectedTable(null);
      }
    },
    [state, waiterName]
  );

  const handleAddTable = useCallback(async () => {
    if (!waiterName.trim()) {
      setError("Escreve o teu nome antes de adicionar uma mesa.");
      return;
    }
    if (!window.confirm("Adicionar uma mesa nova ao mapa?")) return;
    setAddingTable(true);
    setError("");
    try {
      const { table } = await addDiningTable(waiterName.trim());
      await refresh();
      setToast(`Mesa ${table.number} adicionada`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao adicionar mesa");
    } finally {
      setAddingTable(false);
    }
  }, [waiterName, refresh]);

  const handleOpenTable = useCallback(async () => {
    if (!selectedTable || !waiterName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const people = isBalcaoTable(selectedTable) ? 1 : guestCount;
      await openTable(selectedTable, waiterName, people);
      await refresh();
      setScreen("menu");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [selectedTable, waiterName, guestCount, refresh]);

  const handleRequestBill = useCallback(async () => {
    if (!selectedTable) return;
    if (
      !window.confirm(
        `Pedir conta de ${tableFullLabel(selectedTable)}? A caixa passa a ver este pedido.`
      )
    ) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      await requestBill(selectedTable);
      setToast("Conta pedida");
      await refresh();
      setScreen("pedido");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [selectedTable, refresh]);

  const handleReopenRound = useCallback(async () => {
    if (!selectedTable) return;
    if (
      !window.confirm(
        `Nova ronda em ${tableFullLabel(selectedTable)}?\nA mesa deixa de estar «a pagar» e podes voltar a pedir comida. A caixa deixa de a destacar até pedires a conta outra vez.`
      )
    ) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      await reopenTableRound(selectedTable, waiterName);
      setToast("Nova ronda — podes pedir comida");
      await refresh();
      setScreen("menu");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [selectedTable, waiterName, refresh]);

  const handleClearTable = useCallback(async () => {
    if (!selectedTable) return;
    if (
      !window.confirm(
        `Fechar ${tableFullLabel(selectedTable)} sem pagar?\nSó para erro ou mesa vazia.`
      )
    ) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      await clearTable(selectedTable, waiterName);
      setToast("Mesa fechada");
      setSelectedTable(null);
      setScreen("mesas");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [selectedTable, waiterName, refresh]);

  const doAddItem = useCallback(
    async (
      item: MenuItem,
      payload: {
        quantity: number;
        customizations: Array<{
          groupId: string;
          groupLabel: string;
          optionId: string;
          optionLabel: string;
        }>;
        notes: string;
      }
    ) => {
      if (!selectedTable) return;
      setAddingId(item.id);
      setError("");
      try {
        await addItem(selectedTable, { menuItemId: item.id, ...payload });
        const msg = item.isAddon
          ? `+ ${item.name} no prato`
          : `${item.name} · pendente`;
        setToast(msg);
        setCustomizeItem(null);
        setScreen("menu");
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      } finally {
        setAddingId(null);
      }
    },
    [selectedTable, refresh]
  );

  const handleQuickAdd = useCallback(
    (item: MenuItem) => {
      if (!selectedTable || !currentOrder) return;
      if (needsCustomization(item)) {
        setCustomizeItem(item);
        setScreen("personalizar");
        return;
      }
      doAddItem(item, {
        quantity: 1,
        customizations: getDefaultCustomizations(item),
        notes: "",
      });
    },
    [selectedTable, currentOrder, doAddItem]
  );

  const handleSendToKitchen = useCallback(
    async (itemIds?: string[]) => {
      if (!selectedTable || pendingCount === 0) return;
      const pending =
        currentOrder?.items.filter(
          (i) =>
            !i.isAddon &&
            i.status === "pendente" &&
            (!itemIds || itemIds.includes(i.id))
        ) ?? [];
      const count = pending.length;
      if (count === 0) return;
      const drinks = pending.filter((i) => i.skipKitchen).length;
      const food = pending.length - drinks;
      setLoading(true);
      try {
        await sendToKitchen(selectedTable, itemIds);
        const parts: string[] = [];
        if (food > 0) parts.push(`${food} à cozinha`);
        if (drinks > 0) parts.push(`${drinks} ao bar`);
        setToast(parts.join(" · ") || "Enviado");
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      } finally {
        setLoading(false);
      }
    },
    [selectedTable, pendingCount, currentOrder, refresh]
  );

  const handleGuestCountChange = useCallback(
    async (count: number) => {
      if (!selectedTable) return;
      setLoading(true);
      setError("");
      try {
        await updateGuestCount(selectedTable, count);
        setGuestCount(count);
        await refresh();
        setToast(`Mesa actualizada: ${count} pessoas`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      } finally {
        setLoading(false);
      }
    },
    [selectedTable, refresh]
  );

  const handleRemoveItem = useCallback(
    async (itemId: string) => {
      if (!selectedTable) return;
      try {
        await removeItem(selectedTable, itemId);
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    },
    [selectedTable, refresh]
  );

  const handleCancelItem = useCallback(
    async (itemId: string) => {
      if (!selectedTable) return;
      if (
        !window.confirm(
          "Cancelar este prato? Se já foi enviado à cozinha, será emitido um alerta."
        )
      ) {
        return;
      }
      setLoading(true);
      setError("");
      try {
        await cancelItem(selectedTable, itemId);
        setToast("Prato cancelado");
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      } finally {
        setLoading(false);
      }
    },
    [selectedTable, refresh]
  );

  const handleUpdateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!selectedTable) return;
      try {
        await updateOrderItem(selectedTable, itemId, { quantity });
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      }
    },
    [selectedTable, refresh]
  );

  const handleEditItem = useCallback(
    (item: OrderItem) => {
      if (item.status === "pronto" || item.status === "entregue") {
        setError("Este prato já está pronto — não é possível alterar.");
        return;
      }
      const menuItem = menuItems.find((entry) => entry.id === item.menuItemId);
      if (!menuItem) {
        setError("Produto não encontrado no menu.");
        return;
      }
      setEditingItem(item);
      setCustomizeItem(menuItem);
      setScreen("editar");
    },
    [menuItems]
  );

  const handleSaveEdit = useCallback(
    async (payload: {
      quantity: number;
      customizations: Array<{
        groupId: string;
        groupLabel: string;
        optionId: string;
        optionLabel: string;
      }>;
      notes: string;
    }) => {
      if (!selectedTable || !editingItem) return;
      setAddingId(editingItem.id);
      setError("");
      try {
        await updateOrderItem(selectedTable, editingItem.id, payload);
        setToast(`${editingItem.name} atualizado`);
        setEditingItem(null);
        setCustomizeItem(null);
        setScreen("pedido");
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      } finally {
        setAddingId(null);
      }
    },
    [selectedTable, editingItem, refresh]
  );

  const handleTransfer = useCallback(
    async (toTableNumber: number) => {
      if (!selectedTable) return;
      if (
        !window.confirm(
          `Transferir pedido da mesa ${selectedTable} para a mesa ${toTableNumber}?`
        )
      ) {
        return;
      }
      setLoading(true);
      setError("");
      try {
        await transferTable(selectedTable, toTableNumber);
        setSelectedTable(toTableNumber);
        setToast(`Pedido transferido para mesa ${toTableNumber}`);
        setScreen("pedido");
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      } finally {
        setLoading(false);
      }
    },
    [selectedTable, refresh]
  );

  const handleMerge = useCallback(
    async (withTableNumber: number) => {
      if (!selectedTable) return;
      if (
        !window.confirm(
          `Juntar mesa ${withTableNumber} a esta conta? A outra mesa ficará livre.`
        )
      ) {
        return;
      }
      setLoading(true);
      setError("");
      try {
        await mergeTables(selectedTable, withTableNumber);
        setToast(`Mesa ${withTableNumber} juntada a esta conta`);
        setScreen("pedido");
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      } finally {
        setLoading(false);
      }
    },
    [selectedTable, refresh]
  );

  if (!state && stateLoading) {
    if (nested) {
      return <StaffLoader label="A carregar mesas…" compact />;
    }
    return <StaffLoader label="A carregar mesas…" fullScreen />;
  }

  if (screen === "editar" && customizeItem && editingItem) {
    return (
      <>
        {toast && <AddToast message={toast} onDone={() => setToast(null)} />}
        {error && (
          <div className="fixed top-4 inset-x-4 z-50 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-800 text-xs">
            {error}
            <button className="ml-2 text-xs uppercase" onClick={() => setError("")}>
              Fechar
            </button>
          </div>
        )}
        <PersonalizarPage
          item={customizeItem}
          addonItems={addons}
          mode="edit"
          initialQuantity={editingItem.quantity}
          initialNotes={editingItem.notes}
          initialCustomizations={editingItem.customizations}
          onBack={() => {
            setEditingItem(null);
            setCustomizeItem(null);
            setScreen("pedido");
          }}
          onAdd={handleSaveEdit}
          loading={addingId === editingItem.id}
          nested={nested}
        />
      </>
    );
  }

  if (screen === "personalizar" && customizeItem) {
    return (
      <>
        {toast && <AddToast message={toast} onDone={() => setToast(null)} />}
        <PersonalizarPage
          item={customizeItem}
          addonItems={addons}
          onBack={() => setScreen("menu")}
          onAdd={(p) => doAddItem(customizeItem, p)}
          loading={addingId === customizeItem.id}
          nested={nested}
        />
      </>
    );
  }

  if (screen === "mesa-acoes" && selectedTable) {
    return (
      <>
        {error && (
          <div className="fixed top-4 inset-x-4 z-50 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-800 text-xs">
            {error}
            <button className="ml-2 text-xs uppercase" onClick={() => setError("")}>
              Fechar
            </button>
          </div>
        )}
        <MesaActionsPage
          tableNumber={selectedTable}
          tables={state?.tables ?? []}
          guestCount={currentTable?.guestCount ?? guestCount}
          loading={loading}
          onBack={() => setScreen("pedido")}
          onTransfer={handleTransfer}
          onMerge={handleMerge}
          onGuestCountChange={handleGuestCountChange}
          onRequestBill={() => void handleRequestBill()}
          onReopenRound={() => void handleReopenRound()}
          onClearTable={() => void handleClearTable()}
          billRequested={currentTable?.status === "a_pagar"}
          nested={nested}
        />
      </>
    );
  }

  if (screen === "pedido" && currentOrder && selectedTable) {
    return (
      <>
        {toast && <AddToast message={toast} onDone={() => setToast(null)} />}
        {error && (
          <div className="fixed top-4 inset-x-4 z-50 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-800 text-xs">
            {error}
            <button className="ml-2 text-xs uppercase" onClick={() => setError("")}>
              Fechar
            </button>
          </div>
        )}
        <PedidoPage
          tableNumber={selectedTable}
          table={currentTable}
          order={currentOrder}
          total={total}
          pendingCount={pendingCount}
          loading={loading}
          menuItems={menuItems}
          onBack={() => setScreen("menu")}
          onRemoveItem={handleRemoveItem}
          onCancelItem={handleCancelItem}
          onEditItem={handleEditItem}
          onUpdateQuantity={handleUpdateQuantity}
          onSendToKitchen={handleSendToKitchen}
          onTableActions={() => setScreen("mesa-acoes")}
          onRequestBill={() => void handleRequestBill()}
          onReopenRound={() => void handleReopenRound()}
          nested={nested}
        />
      </>
    );
  }

  if (screen === "menu" && currentOrder && selectedTable) {
    const billRequested = currentTable?.status === "a_pagar";
    return (
      <ScreenPage nested={nested}>
        {toast && <AddToast message={toast} onDone={() => setToast(null)} />}
        {error && (
          <div className="mx-3 mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-800 text-xs shrink-0">
            {error}
            <button
              className="ml-2 text-xs uppercase"
              onClick={() => setError("")}
            >
              Fechar
            </button>
          </div>
        )}

        <ScreenHeader
          title={tableFullLabel(selectedTable)}
          subtitle={`${itemCount} itens · ${formatPrice(total)}`}
          onBack={goMesas}
          backLabel="Mesas"
          compact={nested}
          showLogout={!nested}
          action={
            <button
              type="button"
              onClick={() => setScreen("pedido")}
              className={`flex flex-col items-center justify-center rounded-xl bg-brand-gold text-white touch-manipulation px-2 ${
                nested ? "min-w-[44px] min-h-[44px]" : "min-w-[52px] min-h-[52px]"
              }`}
            >
              <span className="text-sm font-black">{itemCount}</span>
              <span className="text-[9px] font-bold">Pedido</span>
            </button>
          }
        />

        {billRequested && (
          <div className="mx-3 mt-2 rounded-xl bg-orange-50 border border-orange-300 px-3 py-2.5 text-orange-950 text-xs shrink-0">
            <p className="font-semibold">
              Conta pedida — podes adicionar bebidas. Para comida, inicia nova
              ronda.
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleReopenRound()}
              className="mt-2 w-full min-h-[40px] rounded-lg border border-sky-400 bg-sky-50 text-sky-950 font-bold touch-manipulation"
            >
              Nova ronda
            </button>
          </div>
        )}

        <ScreenBody>
          {menuLoading ? (
            <div className="p-8 text-center text-brand-muted">
              A carregar menu…
            </div>
          ) : menuError ? (
            <div className="p-4 text-center text-red-400 text-sm">
              {menuError}
            </div>
          ) : (
            <MenuGrid
              categories={categories}
              items={menuItems}
              addons={addons}
              onQuickAdd={handleQuickAdd}
              onCustomize={(item) => {
                setCustomizeItem(item);
                setScreen("personalizar");
              }}
              addingId={addingId}
            />
          )}
        </ScreenBody>

        {pendingCount > 0 && (
          <ScreenFooter compact={nested}>
            <p className="text-[11px] text-brand-muted text-center mb-2 leading-snug">
              Só vai para cozinha/bar depois de enviares
            </p>
            <button
              onClick={() => handleSendToKitchen()}
              disabled={loading}
              className="btn-primary w-full text-base"
            >
              Enviar {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
            </button>
          </ScreenFooter>
        )}
      </ScreenPage>
    );
  }

  if (screen === "abrir" && selectedTable) {
    return (
      <>
        {error && (
          <div className="fixed top-4 inset-x-4 z-50 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-800 text-xs">
            {error}
          </div>
        )}
        <AbrirMesaPage
          tableNumber={selectedTable}
          waiterName={waiterName}
          onSetWaiterName={setWaiterName}
          guestCount={guestCount}
          onGuestCount={setGuestCount}
          onBack={goMesas}
          onOpen={handleOpenTable}
          loading={loading}
          nested={nested}
        />
      </>
    );
  }

  return (
    <>
      {toast && <AddToast message={toast} onDone={() => setToast(null)} />}
      {error && (
        <div className="fixed top-16 inset-x-4 z-50 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-800 text-xs">
          {error}
          <button className="ml-2 text-xs uppercase" onClick={() => setError("")}>
            Fechar
          </button>
        </div>
      )}
      <MesasPage
        tables={state?.tables ?? []}
        orders={state?.orders ?? []}
        waiterName={waiterName}
        onSetWaiterName={setWaiterName}
        onSelectTable={handleSelectTable}
        onAddTable={() => void handleAddTable()}
        addingTable={addingTable}
        showPortalLink={showPortalLink}
        portalHref={portalHref}
        portalLabel={portalLabel}
        namePlaceholder={namePlaceholder}
        nested={nested}
      />
    </>
  );
}
