"use client";

import { useMemo, useState } from "react";
import {
  CATEGORY_SHORT,
  DRINK_CATEGORY_IDS,
  FOOD_CATEGORY_IDS,
  formatPrice,
  needsCustomization,
  type MenuSection,
} from "@/lib/menu";
import type { MenuCategory, MenuItem } from "@/lib/types";

interface MenuGridProps {
  categories: MenuCategory[];
  items: MenuItem[];
  addons: MenuItem[];
  onQuickAdd: (item: MenuItem) => void;
  onCustomize: (item: MenuItem) => void;
  addingId: string | null;
}

const DEFAULT_CATEGORY: Record<MenuSection, string> = {
  comida: "hamburguer",
  bebida: "bebidas",
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function MenuGrid({
  categories,
  items,
  addons,
  onQuickAdd,
  onCustomize,
  addingId,
}: MenuGridProps) {
  const [section, setSection] = useState<MenuSection>("comida");
  const [category, setCategory] = useState(DEFAULT_CATEGORY.comida);
  const [search, setSearch] = useState("");

  const searchActive = search.trim().length > 0;
  const searchNorm = normalizeSearch(search);

  const searchResults = useMemo(() => {
    if (!searchActive) return [];
    return items.filter((item) =>
      normalizeSearch(item.name).includes(searchNorm)
    );
  }, [items, searchActive, searchNorm]);

  const sectionCategories = categories.filter((c) =>
    section === "comida"
      ? FOOD_CATEGORY_IDS.includes(c.id as (typeof FOOD_CATEGORY_IDS)[number])
      : DRINK_CATEGORY_IDS.includes(c.id as (typeof DRINK_CATEGORY_IDS)[number])
  );

  const categoryItems = items.filter((i) => i.categoryId === category);
  const cat = categories.find((c) => c.id === category);
  const visibleItems = searchActive ? searchResults : categoryItems;

  function switchSection(next: MenuSection) {
    setSection(next);
    setCategory(DEFAULT_CATEGORY[next]);
    setSearch("");
  }

  function renderItemCard(item: MenuItem) {
    const custom = needsCustomization(item);
    const busy = addingId === item.id;
    const itemCategory = categories.find((c) => c.id === item.categoryId);

    return (
      <button
        key={item.id}
        onClick={() => (custom ? onCustomize(item) : onQuickAdd(item))}
        disabled={busy}
        className={`rounded-2xl p-4 text-left min-h-[100px] touch-manipulation active:scale-[0.98] transition-transform disabled:opacity-50 shadow-sm ${
          custom
            ? "bg-white border-2 border-brand-gold/40"
            : "bg-white border border-brand-line"
        }`}
      >
        {searchActive && itemCategory && (
          <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold mb-1">
            {CATEGORY_SHORT[itemCategory.id] ?? itemCategory.name}
          </p>
        )}
        <p className="font-bold text-brand-gold text-sm leading-snug pr-2">
          {item.name}
        </p>
        <p className="text-brand-gold font-black text-lg mt-2">
          {formatPrice(item.price)}
        </p>
        <p className="text-[10px] text-brand-muted mt-2 font-semibold uppercase">
          {busy ? "A adicionar…" : custom ? "Escolher opções" : "Adicionar"}
        </p>
      </button>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <section className="px-4 pt-3 pb-2 border-b border-brand-line space-y-2">
        <input
          className="input text-sm !min-h-[44px]"
          placeholder="Pesquisar no menu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {!searchActive && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => switchSection("comida")}
              className={`rounded-2xl py-4 text-sm font-black uppercase tracking-wide touch-manipulation min-h-[56px] ${
                section === "comida"
                  ? "bg-brand-gold text-white shadow-sm"
                  : "bg-white text-brand-muted border border-brand-line"
              }`}
            >
              Comida
            </button>
            <button
              onClick={() => switchSection("bebida")}
              className={`rounded-2xl py-4 text-sm font-black uppercase tracking-wide touch-manipulation min-h-[56px] ${
                section === "bebida"
                  ? "bg-brand-gold text-white shadow-sm"
                  : "bg-white text-brand-muted border border-brand-line"
              }`}
            >
              Bebida
            </button>
          </div>
        )}
      </section>

      {!searchActive && section === "comida" && addons.length > 0 && (
        <section className="px-4 pt-4 pb-2">
          <p className="text-[10px] uppercase tracking-widest text-brand-muted mb-2 font-bold">
            Extras rápidos
          </p>
          <div className="grid grid-cols-2 gap-2">
            {addons.map((addon) => (
              <button
                key={addon.id}
                onClick={() => onQuickAdd(addon)}
                disabled={addingId === addon.id}
                className="rounded-xl bg-white border border-brand-line px-3 py-3 text-left touch-manipulation active:bg-amber-50 disabled:opacity-50 shadow-sm"
              >
                <span className="text-brand-gold font-bold text-sm block">
                  + {addon.name}
                </span>
                <span className="text-brand-muted text-xs">
                  {formatPrice(addon.price)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {!searchActive && (
        <section className="px-4 py-2 border-b border-brand-line">
          <div className="grid grid-cols-3 gap-2">
            {sectionCategories.map((catItem) => (
              <button
                key={catItem.id}
                onClick={() => setCategory(catItem.id)}
                className={`rounded-xl py-3 px-2 text-xs font-bold touch-manipulation min-h-[48px] ${
                  category === catItem.id
                    ? "bg-brand-gold text-white"
                    : "bg-white text-brand-muted border border-brand-line"
                }`}
              >
                {CATEGORY_SHORT[catItem.id]}
              </button>
            ))}
          </div>
        </section>
      )}

      {!searchActive && cat?.note && (
        <p className="px-4 py-2 text-xs text-brand-muted bg-amber-50/60 border-l-2 border-brand-gold/50">
          {cat.note}
        </p>
      )}

      {searchActive && (
        <p className="px-4 py-2 text-xs text-brand-muted">
          {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""}{" "}
          para «{search.trim()}»
        </p>
      )}

      <section className="p-4 grid grid-cols-2 gap-3 pb-8">
        {visibleItems.length === 0 ? (
          <p className="col-span-2 text-center text-brand-muted py-8 text-sm">
            {searchActive ? "Nenhum produto encontrado" : "Sem produtos"}
          </p>
        ) : (
          visibleItems.map((item) => renderItemCard(item))
        )}
      </section>
    </div>
  );
}
