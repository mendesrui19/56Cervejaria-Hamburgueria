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
}

export function PersonalizarPage({
  item,
  addonItems,
  onBack,
  onAdd,
  loading,
  nested = false,
}: PersonalizarPageProps) {
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    item.optionGroups?.forEach((group) => {
      const def = group.options.find((o) => o.default) ?? group.options[0];
      defaults[group.id] = def.id;
    });
    return defaults;
  });
  const [extras, setExtras] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");

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
    onAdd({ quantity: 1, customizations, notes });
  }

  return (
    <ScreenPage nested={nested}>
      <ScreenHeader
        title={item.name}
        subtitle={formatPrice(totalPrice)}
        onBack={onBack}
        backLabel="Menu"
        compact={nested}
      />

      <ScreenBody>
        <div className="p-4 space-y-5">
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
              Nota para a cozinha
            </h2>
            <input
              className="input"
              placeholder="Opcional — ex: sem cebola"
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
          Adicionar — {formatPrice(totalPrice)}
        </button>
      </ScreenFooter>
    </ScreenPage>
  );
}
