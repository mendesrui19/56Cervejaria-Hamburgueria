"use client";

import { useState } from "react";
import {
  CATEGORY_SHORT,
  MENU_CATEGORIES,
  MENU_ITEMS,
  formatPrice,
  getCategoryItems,
  needsCustomization,
} from "@/lib/menu";
import type { MenuItem, OrderItemCustomization } from "@/lib/types";

interface QuickCustomizeSheetProps {
  item: MenuItem;
  onClose: () => void;
  onAdd: (payload: {
    quantity: number;
    customizations: OrderItemCustomization[];
    notes: string;
  }) => void;
}

export function QuickCustomizeSheet({
  item,
  onClose,
  onAdd,
}: QuickCustomizeSheetProps) {
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    item.optionGroups?.forEach((group) => {
      const def = group.options.find((o) => o.default) ?? group.options[0];
      defaults[group.id] = def.id;
    });
    return defaults;
  });
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  function handleAdd() {
    const customizations: OrderItemCustomization[] =
      item.optionGroups?.map((group) => {
        const option = group.options.find((o) => o.id === selections[group.id])!;
        return {
          groupId: group.id,
          groupLabel: group.label,
          optionId: option.id,
          optionLabel: option.label,
        };
      }) ?? [];

    onAdd({ quantity: 1, customizations, notes });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-brand-card border-t border-brand-gold/25 rounded-t-2xl safe-bottom animate-slide-up">
        <div className="px-4 pt-4 pb-3">
          <div className="flex justify-between items-start gap-3 mb-3">
            <div>
              <h2 className="text-lg font-bold text-brand-gold leading-tight">
                {item.name}
              </h2>
              <p className="text-brand-gold font-semibold">
                {formatPrice(item.price)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="touch-target text-brand-muted text-xl"
            >
              Fechar
            </button>
          </div>

          {item.excludesFries && (
            <p className="text-xs text-yellow-300 mb-3 bg-yellow-900/30 rounded-lg px-3 py-2">
              Batata não incluída
            </p>
          )}

          {item.optionGroups?.map((group) => (
            <div key={group.id} className="mb-3">
              <p className="text-xs font-bold text-brand-muted uppercase mb-1.5">
                {group.label}
              </p>
              <div className="flex gap-2 flex-wrap">
                {group.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() =>
                      setSelections((s) => ({ ...s, [group.id]: option.id }))
                    }
                    className={`rounded-xl px-4 py-3 text-sm font-semibold min-h-[48px] touch-manipulation ${
                      selections[group.id] === option.id
                        ? "bg-brand-gold text-white"
                        : "bg-brand-surface text-brand-muted border border-brand-gold/20"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {!showNotes ? (
            <button
              onClick={() => setShowNotes(true)}
              className="text-xs text-brand-muted py-1 mb-2"
            >
              + Nota para cozinha
            </button>
          ) : (
            <input
              className="input mb-3 text-sm"
              placeholder="Nota (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              autoFocus
            />
          )}
        </div>

        <div className="px-4 pb-4">
          <button onClick={handleAdd} className="btn-primary w-full text-base">
            Adicionar — {formatPrice(item.price)}
          </button>
        </div>
      </div>
    </div>
  );
}

interface FastMenuProps {
  onQuickAdd: (item: MenuItem) => void;
  onCustomize: (item: MenuItem) => void;
  addingId: string | null;
}

export function FastMenu({ onQuickAdd, onCustomize, addingId }: FastMenuProps) {
  const [activeCategory, setActiveCategory] = useState("hamburguer");
  const items = getCategoryItems(activeCategory);
  const addons = MENU_ITEMS.filter((i) => i.isAddon);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Extras — 1 toque */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 shrink-0 px-1">
        {addons.map((addon) => (
          <button
            key={addon.id}
            onClick={() => onQuickAdd(addon)}
            disabled={addingId === addon.id}
            className="flex-shrink-0 rounded-xl bg-brand-surface border border-brand-gold/25 px-3 py-2.5 text-xs font-bold text-brand-gold min-h-[44px] touch-manipulation active:bg-brand-gold/15 disabled:opacity-50"
          >
            +{addon.name.split(" ")[0]} {formatPrice(addon.price)}
          </button>
        ))}
      </div>

      {/* Categorias */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 shrink-0 px-1">
        {MENU_CATEGORIES.filter((c) => c.id !== "acompanhamentos").map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 rounded-lg px-3 py-2.5 text-xs font-bold min-h-[40px] touch-manipulation ${
              activeCategory === cat.id
                ? "bg-brand-gold text-white"
                : "bg-brand-surface text-brand-muted"
            }`}
          >
            {CATEGORY_SHORT[cat.id] ?? cat.name}
          </button>
        ))}
      </div>

      {/* Produtos — grelha 2 colunas, toque rápido */}
      <div className="grid grid-cols-2 gap-2 overflow-y-auto scrollbar-thin flex-1 min-h-0 pb-2 px-1">
        {items.map((item) => {
          const custom = needsCustomization(item);
          const isAdding = addingId === item.id;

          return (
            <button
              key={item.id}
              onClick={() =>
                custom ? onCustomize(item) : onQuickAdd(item)
              }
              disabled={isAdding}
              className={`relative rounded-xl border text-left p-3 min-h-[80px] touch-manipulation active:scale-[0.97] transition-transform disabled:opacity-60 ${
                custom
                  ? "border-brand-gold/40 bg-brand-card"
                  : "border-brand-gold/20 bg-brand-surface active:bg-brand-gold/10"
              }`}
            >
              <p className="font-bold text-brand-gold text-sm leading-tight pr-6">
                {item.name}
              </p>
              <p className="text-brand-gold font-black text-base mt-1">
                {formatPrice(item.price)}
              </p>
              <span
                className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${
                  custom
                    ? "bg-brand-gold/20 text-brand-gold"
                    : "bg-brand-gold text-white"
                }`}
              >
                {isAdding ? "…" : custom ? "⚙" : "+"}
              </span>
              {custom && (
                <p className="text-[10px] text-brand-muted mt-1">Personalizar</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Keep exports for desktop compatibility
export { QuickCustomizeSheet as AddItemModal };
