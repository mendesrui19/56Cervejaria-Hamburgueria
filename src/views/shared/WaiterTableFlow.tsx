"use client";

import { useCallback, useEffect, useState } from "react";
import { AddToast } from "@/components/AddToast";
import {
  ScreenBody,
  ScreenFooter,
  ScreenHeader,
  ScreenPage,
} from "@/components/ScreenLayout";
import {
  addItem,
  fetchState,
  openTable,
  removeItem,
  sendToKitchen,
} from "@/lib/api";
import {
  getDefaultCustomizations,
  needsCustomization,
  formatPrice,
} from "@/lib/menu";
import { calculateOrderTotal } from "@/lib/utils";
import type { MenuItem, RestaurantState } from "@/lib/types";
import { usePolling } from "@/hooks/usePolling";
import { useMenu } from "@/hooks/useMenu";
import { MenuGrid } from "@/views/empregado/MenuGrid";
import {
  AbrirMesaPage,
  MesasPage,
  PedidoPage,
} from "@/views/empregado/PedidoPage";
import { PersonalizarPage } from "@/views/empregado/PersonalizarPage";

type Screen = "mesas" | "abrir" | "menu" | "pedido" | "personalizar";

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
  const { data: state, refresh } = usePolling<RestaurantState>(fetchState, 3000);
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
  const [waiterName, setWaiterName] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(nameStorageKey);
    if (saved) setWaiterName(saved);
  }, [nameStorageKey]);

  useEffect(() => {
    if (waiterName) localStorage.setItem(nameStorageKey, waiterName);
  }, [waiterName, nameStorageKey]);

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
      (i) => !i.isAddon && !i.skipKitchen && i.status === "pendente"
    ).length ?? 0;
  const itemCount =
    currentOrder?.items.filter((i) => !i.isAddon).length ?? 0;

  const goMesas = useCallback(() => {
    setScreen("mesas");
    setCustomizeItem(null);
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
        setScreen("menu");
      } else if (table?.status === "livre") {
        setScreen("abrir");
      } else {
        setScreen("menu");
      }
    },
    [state, waiterName]
  );

  const handleOpenTable = useCallback(async () => {
    if (!selectedTable || !waiterName.trim()) return;
    setLoading(true);
    setError("");
    try {
      await openTable(selectedTable, waiterName, guestCount);
      await refresh();
      setScreen("menu");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [selectedTable, waiterName, guestCount, refresh]);

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
        const msg = item.isAddon ? `+ ${item.name} no prato` : item.name;
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

  const handleSendToKitchen = useCallback(async () => {
    if (!selectedTable || pendingCount === 0) return;
    setLoading(true);
    try {
      await sendToKitchen(selectedTable);
      setToast(
        `${pendingCount} enviado${pendingCount > 1 ? "s" : ""} à cozinha`
      );
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [selectedTable, pendingCount, refresh]);

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

  if (screen === "pedido" && currentOrder && selectedTable) {
    return (
      <>
        {toast && <AddToast message={toast} onDone={() => setToast(null)} />}
        <PedidoPage
          tableNumber={selectedTable}
          table={currentTable}
          order={currentOrder}
          total={total}
          pendingCount={pendingCount}
          loading={loading}
          onBack={() => setScreen("menu")}
          onRemoveItem={handleRemoveItem}
          onSendToKitchen={handleSendToKitchen}
          nested={nested}
        />
      </>
    );
  }

  if (screen === "menu" && currentOrder && selectedTable) {
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
          title={`Mesa ${selectedTable}`}
          subtitle={`${itemCount} itens · ${formatPrice(total)}`}
          onBack={goMesas}
          backLabel="Mesas"
          compact={nested}
          action={
            <button
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
            <button
              onClick={handleSendToKitchen}
              disabled={loading}
              className="btn-primary w-full text-base"
            >
              Enviar {pendingCount} à Cozinha
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
        waiterName={waiterName}
        onSetWaiterName={setWaiterName}
        onSelectTable={handleSelectTable}
        showPortalLink={showPortalLink}
        portalHref={portalHref}
        portalLabel={portalLabel}
        namePlaceholder={namePlaceholder}
        nested={nested}
      />
    </>
  );
}
