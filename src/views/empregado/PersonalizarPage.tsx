"use client";

import { useMemo, useState } from "react";
import {
  calculateItemPrice,
  formatPrice,
  supportsItemAddons,
} from "@/lib/menu";
import type { MenuItem, OrderItemCustomization } from "@/lib/types";
import {
  ScreenBody,
  ScreenFooter,
  ScreenHeader,
  ScreenPage,
} from "@/components/ScreenLayout";

interface PersonalizarPageProps {
  item: MenuItem;
  addonItems: MenuItem[];
  onBack: () => void;
  onAdd: (payload: {
    quantity: number;
    customizations: OrderItemCustomization[];
    notes: string;
  }) => void;
  loading: boolean;
  nested?: boolean;
  mode?: "add" | "edit";
  initialQuantity?: number;
  initialNotes?: string;
  initialCustomizations?: OrderItemCustomization[];
}

export function PersonalizarPage({
  item,
  addonItems,
  onBack,
  onAdd,
  loading,
  nested = false,
  mode = "add",
  initialQuantity = 1,
  initialNotes = "",
  initialCustomizations,
}: PersonalizarPageProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    if (initialCustomizations?.length) {
      const fromOrder: Record<string, string> = {};
      initialCustomizations
        .filter((c) => !c.groupId.startsWith("extra-"))
        .forEach((c) => {
          fromOrder[c.groupId] = c.optionId;
        });
      if (Object.keys(fromOrder).length > 0) return fromOrder;
    }

    const defaults: Record<string, string> = {};
    item.optionGroups?.forEach((group) => {
      const def = group.options.find((o) => o.default) ?? group.options[0];
      defaults[group.id] = def.id;
    });
    return defaults;
  });
  const [extras, setExtras] = useState<Set<string>>(() => {
    if (!initialCustomizations?.length) return new Set();
    return new Set(
      initialCustomizations
        .filter((c) => c.groupId.startsWith("extra-"))
        .map((c) => c.optionId)
    );
  });
  const [notes, setNotes] = useState(initialNotes);

  const addonItemsList = addonItems;

  const customizations = useMemo((): OrderItemCustomization[] => {
    const base =
      item.optionGroups?.map((group) => {
        const option = group.options.find((o) => o.id === selections[group.id])!;
        return {
          groupId: group.id,
          groupLabel: group.label,
          optionId: option.id,
          optionLabel: option.label,
        };
      }) ?? [];

    const extraCustomizations = [...extras].map((addonId) => {
      const addon = addonItemsList.find((a) => a.id === addonId)!;
      return {
        groupId: `extra-${addon.id}`,
        groupLabel: "Extra",
        optionId: addon.id,
        optionLabel: addon.name,
      };
    });

    return [...base, ...extraCustomizations];
  }, [item.optionGroups, selections, extras, addonItemsList]);

  const showExtras = supportsItemAddons(item);

  const totalPrice = calculateItemPrice(item, customizations, (id) =>
    addonItemsList.find((a) => a.id === id)
  );

  function toggleExtra(addonId: string) {
    setExtras((prev) => {
      const next = new Set(prev);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      return next;
    });
  }

  function handleAdd() {
    onAdd({ quantity, customizations, notes });
  }

  const totalLine = totalPrice * quantity;

  return (
    <ScreenPage nested={nested}>
      <ScreenHeader
        title={mode === "edit" ? `Editar — ${item.name}` : item.name}
        subtitle={formatPrice(totalLine)}
        onBack={onBack}
        backLabel={mode === "edit" ? "Pedido" : "Menu"}
        compact={nested}
        showLogout={!nested}
      />

      <ScreenBody>
        <div className="p-4 space-y-5">
          {(mode === "add" || mode === "edit") && (
            <section>
              <h2 className="text-sm font-bold text-brand-gold mb-2">
                Quantidade
              </h2>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="min-w-[48px] min-h-[48px] rounded-full bg-brand-surface border border-brand-gold/30 text-brand-gold text-xl"
                >
                  −
                </button>
                <span className="text-3xl font-black text-brand-gold w-10 text-center tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  className="min-w-[48px] min-h-[48px] rounded-full bg-brand-surface border border-brand-gold/30 text-brand-gold text-xl"
                >
                  +
                </button>
              </div>
            </section>
          )}
          {item.excludesFries && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-900 text-sm">
              Batata frita não incluída
            </div>
          )}

          {item.optionGroups?.map((group) => (
            <section key={group.id}>
              <h2 className="text-sm font-bold text-brand-gold mb-3">
                {group.label}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {group.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() =>
                      setSelections((s) => ({ ...s, [group.id]: option.id }))
                    }
                    className={`rounded-2xl px-4 py-4 text-sm font-bold min-h-[56px] touch-manipulation ${
                      selections[group.id] === option.id
                        ? "bg-brand-gold text-white shadow-lg shadow-brand-gold/20"
                        : "bg-brand-card border border-brand-gold/20 text-brand-muted"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>
          ))}

          {showExtras && addonItems.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-brand-gold mb-3">
                Extras neste prato
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {addonItems.map((addon) => (
                  <button
                    key={addon.id}
                    onClick={() => toggleExtra(addon.id)}
                    className={`rounded-2xl px-4 py-4 text-left min-h-[56px] touch-manipulation ${
                      extras.has(addon.id)
                        ? "bg-brand-gold text-white shadow-lg shadow-brand-gold/20"
                        : "bg-brand-card border border-brand-gold/20 text-brand-muted"
                    }`}
                  >
                    <span className="text-sm font-bold block">+ {addon.name}</span>
                    <span className="text-xs opacity-80">
                      {formatPrice(addon.price)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-bold text-brand-gold mb-2">
              {item.skipKitchen ? "Nota para o bar" : "Nota para a cozinha"}
            </h2>
            <input
              className="input"
              placeholder={
                item.skipKitchen
                  ? "Opcional — ex: bem fresca"
                  : "Opcional — ex: sem cebola"
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>
        </div>
      </ScreenBody>

      <ScreenFooter compact={nested}>
        <button
          onClick={handleAdd}
          disabled={loading}
          className="btn-primary w-full text-base"
        >
          {mode === "edit"
            ? `Guardar — ${formatPrice(totalLine)}`
            : `Adicionar — ${formatPrice(totalLine)}`}
        </button>
      </ScreenFooter>
    </ScreenPage>
  );
}
