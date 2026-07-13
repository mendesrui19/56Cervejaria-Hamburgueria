"use client";

import { useState } from "react";
import {
  MENU_CATEGORIES,
  MENU_ITEMS,
  formatPrice,
  getCategoryItems,
} from "@/lib/menu";
import type { MenuItem, OrderItemCustomization } from "@/lib/types";

interface AddItemModalProps {
  item: MenuItem;
  onClose: () => void;
  onAdd: (payload: {
    quantity: number;
    customizations: OrderItemCustomization[];
    notes: string;
  }) => void;
}

export function AddItemModal({ item, onClose, onAdd }: AddItemModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    item.optionGroups?.forEach((group) => {
      const def = group.options.find((o) => o.default) ?? group.options[0];
      defaults[group.id] = def.id;
    });
    return defaults;
  });
  const [error, setError] = useState("");

  function handleAdd() {
    const customizations: OrderItemCustomization[] = [];

    if (item.optionGroups) {
      for (const group of item.optionGroups) {
        const selectedId = selections[group.id];
        if (!selectedId && group.required) {
          setError(`Selecione: ${group.label}`);
          return;
        }
        const option = group.options.find((o) => o.id === selectedId);
        if (option) {
          customizations.push({
            groupId: group.id,
            groupLabel: group.label,
            optionId: option.id,
            optionLabel: option.label,
          });
        }
      }
    }

    onAdd({ quantity, customizations, notes });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center bg-black/70 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[90vh] overflow-hidden flex flex-col rounded-b-none sm:rounded-2xl safe-bottom">
        <div className="flex items-start justify-between mb-3 flex-shrink-0">
          <div className="pr-4 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-brand-gold leading-tight">
              {item.name}
            </h2>
            <p className="text-brand-gold text-lg font-semibold mt-1">
              {formatPrice(item.price)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="touch-target rounded-xl text-brand-muted hover:text-brand-gold flex-shrink-0 text-xl"
            aria-label="Fechar"
          >
            Fechar
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-thin flex-1 -mx-1 px-1">
          {item.excludesFries && (
            <div className="mb-4 rounded-xl bg-yellow-900/30 border border-yellow-700/40 px-3 py-2.5 text-yellow-200 text-sm">
              Batata frita NÃO incluída — adicione como extra se necessário.
            </div>
          )}

          {item.ingredients.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-brand-muted uppercase tracking-wide mb-2">
                Ingredientes
              </p>
              <ul className="text-sm text-brand-muted space-y-0.5">
                {item.ingredients.map((ing) => (
                  <li key={ing}>• {ing}</li>
                ))}
              </ul>
            </div>
          )}

          {item.optionGroups?.map((group) => (
            <div key={group.id} className="mb-4">
              <p className="text-sm font-semibold text-brand-gold mb-2">
                {group.label}
                {group.required && <span className="text-red-400 ml-1">*</span>}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() =>
                      setSelections((s) => ({ ...s, [group.id]: option.id }))
                    }
                    className={`rounded-xl border px-4 py-3.5 text-sm font-medium transition-all min-h-[52px] touch-manipulation ${
                      selections[group.id] === option.id
                        ? "border-brand-gold bg-brand-gold/20 text-brand-gold"
                        : "border-brand-gold/20 text-brand-muted active:bg-brand-surface"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mb-4">
            <p className="text-sm font-semibold text-brand-gold mb-2">
              Quantidade
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="touch-target rounded-full bg-brand-surface border border-brand-gold/30 text-brand-gold text-2xl font-bold"
              >
                −
              </button>
              <span className="text-3xl font-bold text-brand-gold w-10 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="touch-target rounded-full bg-brand-surface border border-brand-gold/30 text-brand-gold text-2xl font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold text-brand-gold mb-2">
              Notas para a cozinha
            </p>
            <textarea
              className="input resize-none h-24"
              placeholder="Ex: sem cebola, bem passado, alergia a glúten..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        </div>

        <div className="flex-shrink-0 pt-3 border-t border-brand-gold/10 mt-2">
          <button onClick={handleAdd} className="btn-primary w-full text-base">
            Adicionar — {formatPrice(item.price * quantity)}
          </button>
        </div>
      </div>
    </div>
  );
}

interface MenuPanelProps {
  onSelectItem: (item: MenuItem) => void;
}

export function MenuPanel({ onSelectItem }: MenuPanelProps) {
  const [activeCategory, setActiveCategory] = useState(MENU_CATEGORIES[0].id);

  const category = MENU_CATEGORIES.find((c) => c.id === activeCategory);
  const items = getCategoryItems(activeCategory);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar flex-shrink-0 -mx-1 px-1">
        {MENU_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition-all min-h-[48px] touch-manipulation ${
              activeCategory === cat.id
                ? "bg-brand-gold text-white"
                : "bg-brand-surface text-brand-muted active:bg-brand-card"
            }`}
          >
            <span className="whitespace-nowrap">{cat.name}</span>
          </button>
        ))}
      </div>

      {category?.note && (
        <div className="mb-3 rounded-xl bg-brand-surface border border-brand-gold/20 px-3 py-2.5 text-xs text-brand-muted leading-relaxed">
          {category.note}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto scrollbar-thin flex-1 min-h-0 pb-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="card text-left active:scale-[0.98] transition-transform touch-manipulation min-h-[72px] p-4"
          >
            <div className="flex justify-between items-start gap-3">
              <span className="font-semibold text-brand-gold text-base leading-snug">
                {item.name}
              </span>
              <span className="text-brand-gold font-bold text-base flex-shrink-0">
                {formatPrice(item.price)}
              </span>
            </div>
            {item.optionGroups && item.optionGroups.length > 0 && (
              <p className="text-xs text-brand-muted mt-1.5">Personalizável</p>
            )}
            {item.isAddon && (
              <p className="text-xs text-blue-400 mt-1.5">Extra / Acompanhamento</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AddonQuickBar({
  onSelectAddon,
}: {
  onSelectAddon: (item: MenuItem) => void;
}) {
  const addons = MENU_ITEMS.filter((i) => i.isAddon);

  return (
    <div className="border-t border-brand-gold/15 pt-3 mt-2 flex-shrink-0">
      <p className="text-xs text-brand-muted uppercase tracking-wide mb-2">
        Extras rápidos
      </p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {addons.map((addon) => (
          <button
            key={addon.id}
            onClick={() => onSelectAddon(addon)}
            className="flex-shrink-0 rounded-full border border-brand-gold/30 px-4 py-2.5 text-sm text-brand-gold active:bg-brand-gold/10 transition-colors min-h-[44px] touch-manipulation whitespace-nowrap"
          >
            + {addon.name} ({formatPrice(addon.price)})
          </button>
        ))}
      </div>
    </div>
  );
}
