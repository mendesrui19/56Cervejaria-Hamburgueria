"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminLayout, type AdminSection } from "@/components/admin/AdminLayout";
import { PeriodSelector } from "@/components/admin/PeriodSelector";
import {
  createCatalogItem,
  deleteCatalogItem,
  fetchAdminAnalytics,
  fetchAdminCatalog,
  fetchAdminHistory,
  updateCatalogItem,
} from "@/lib/api";
import { CATEGORY_SHORT, formatPrice } from "@/lib/menu";
import { formatPeriodLabel, parseDateParam, toDateParam } from "@/lib/period";
import type {
  AdminKPIs,
  AnalyticsPeriod,
  MenuCatalog,
  MenuCategory,
  MenuItem,
  OrderHistoryEntry,
} from "@/lib/types";

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  multibanco: "Multibanco",
  mbway: "MB Way",
  misto: "Misto",
};

const SECTION_META: Record<
  AdminSection,
  { title: string; subtitle: string }
> = {
  relatorios: {
    title: "Relatórios",
    subtitle: "KPIs, faturação e análise por período",
  },
  historico: {
    title: "Histórico",
    subtitle: "Todas as contas fechadas",
  },
  catalogo: {
    title: "Catálogo",
    subtitle: "Adicionar, editar e remover produtos",
  },
};

function KpiCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-brand-gold/40 bg-brand-gold/5"
          : "border-brand-gold/15 bg-brand-card"
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">
        {label}
      </p>
      <p className="text-2xl lg:text-3xl font-black text-brand-gold mt-1">
        {value}
      </p>
      {hint && <p className="text-xs text-brand-muted mt-1">{hint}</p>}
    </div>
  );
}

function ReportsSection({ kpis }: { kpis: AdminKPIs }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Faturação" value={formatPrice(kpis.revenue)} highlight />
        <KpiCard label="Contas" value={String(kpis.orderCount)} />
        <KpiCard label="Ticket médio" value={formatPrice(kpis.avgTicket)} />
        <KpiCard label="Itens vendidos" value={String(kpis.itemsSold)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-bold text-brand-gold mb-3 uppercase tracking-wide">
            Top produtos
          </h3>
          {kpis.topItems.length === 0 ? (
            <p className="text-brand-muted text-sm">Sem dados</p>
          ) : (
            <div className="space-y-2">
              {kpis.topItems.map((item) => (
                <div
                  key={item.name}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="text-brand-muted truncate">{item.name}</span>
                  <span className="text-brand-gold font-semibold shrink-0">
                    {item.quantity} · {formatPrice(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-bold text-brand-gold mb-3 uppercase tracking-wide">
            Por mesa
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
            {kpis.byTable.map((row) => (
              <div
                key={row.tableNumber}
                className="flex justify-between gap-3 text-sm"
              >
                <span className="text-brand-muted">
                  Mesa {row.tableNumber} · {row.orders} conta
                  {row.orders !== 1 ? "s" : ""}
                </span>
                <span className="text-brand-gold font-semibold">
                  {formatPrice(row.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-bold text-brand-gold mb-3 uppercase tracking-wide">
            Pagamentos
          </h3>
          <div className="space-y-2">
            {kpis.byPayment.map((row) => (
              <div
                key={row.method}
                className="flex justify-between gap-3 text-sm"
              >
                <span className="text-brand-muted">
                  {PAYMENT_LABELS[row.method] ?? row.method} ({row.count})
                </span>
                <span className="text-brand-gold font-semibold">
                  {formatPrice(row.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-bold text-brand-gold mb-3 uppercase tracking-wide">
            Por empregado
          </h3>
          <div className="space-y-2">
            {kpis.byWaiter.map((row) => (
              <div
                key={row.name}
                className="flex justify-between gap-3 text-sm"
              >
                <span className="text-brand-muted truncate">
                  {row.name} · {row.orders}
                </span>
                <span className="text-brand-gold font-semibold">
                  {formatPrice(row.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-brand-muted text-center">
        Gorjetas: {formatPrice(kpis.tips)} · Subtotal: {formatPrice(kpis.subtotal)}
      </p>
    </div>
  );
}

function HistorySection({
  history,
  period,
  anchorDate,
}: {
  history: OrderHistoryEntry[];
  period: AnalyticsPeriod;
  anchorDate: string;
}) {
  const reference = parseDateParam(anchorDate);
  const [filterTable, setFilterTable] = useState("");

  const filtered = filterTable
    ? history.filter((h) => h.tableNumber === Number(filterTable))
    : history;

  const tables = [...new Set(history.map((h) => h.tableNumber))].sort(
    (a, b) => a - b
  );

  if (history.length === 0) {
    return (
      <p className="text-center text-brand-muted py-16">
        Sem contas fechadas em {formatPeriodLabel(period, reference).toLowerCase()}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-muted">
        {history.length} conta{history.length !== 1 ? "s" : ""} ·{" "}
        <span className="text-brand-gold font-semibold">
          {formatPeriodLabel(period, reference)}
        </span>
      </p>
      {tables.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setFilterTable("")}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold ${
              !filterTable
                ? "bg-brand-gold text-white"
                : "bg-brand-card text-brand-muted border border-brand-gold/10"
            }`}
          >
            Todas
          </button>
          {tables.map((n) => (
            <button
              key={n}
              onClick={() => setFilterTable(String(n))}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold ${
                filterTable === String(n)
                  ? "bg-brand-gold text-white"
                  : "bg-brand-card text-brand-muted border border-brand-gold/10"
              }`}
            >
              Mesa {n}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-brand-muted">
        {filtered.length} conta{filtered.length !== 1 ? "s" : ""}
      </p>

      <div className="space-y-3">
        {filtered.map((entry) => (
          <div key={entry.id} className="card">
            <div className="flex flex-wrap justify-between gap-2 mb-2">
              <div>
                <p className="font-bold text-brand-gold text-lg">
                  Mesa {entry.tableNumber}
                </p>
                <p className="text-sm text-brand-muted">{entry.waiterName}</p>
                <p className="text-xs text-brand-muted mt-0.5">
                  {new Date(entry.paidAt).toLocaleString("pt-PT")}
                  {entry.paymentMethod &&
                    ` · ${PAYMENT_LABELS[entry.paymentMethod] ?? entry.paymentMethod}`}
                </p>
              </div>
              <p className="text-2xl font-black text-brand-gold">
                {formatPrice(entry.total)}
              </p>
            </div>
            <div className="border-t border-brand-gold/10 pt-2 grid sm:grid-cols-2 gap-x-4 gap-y-1">
              {entry.items.map((item, idx) => (
                <div
                  key={`${entry.id}-${idx}`}
                  className="flex justify-between text-sm text-brand-muted"
                >
                  <span className="truncate pr-2">
                    {item.quantity > 1 && `${item.quantity}× `}
                    {item.name}
                  </span>
                  <span className="shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CatalogSection({
  catalog,
  onSaved,
}: {
  catalog: MenuCatalog;
  onSaved: () => void;
}) {
  const [category, setCategory] = useState(catalog.categories[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    categoryId: category,
    type: "comida" as "comida" | "bebida" | "extra",
  });
  const [drafts, setDrafts] = useState<
    Record<string, { name: string; price: string; categoryId: string }>
  >({});

  const editableCategories = catalog.categories.filter(
    (c) => c.id !== "acompanhamentos"
  );

  const items = catalog.items
    .filter((i) => i.categoryId === category)
    .filter((i) =>
      search ? i.name.toLowerCase().includes(search.toLowerCase()) : true
    );

  function getDraft(item: MenuItem) {
    return (
      drafts[item.id] ?? {
        name: item.name,
        price: item.price.toFixed(2),
        categoryId: item.categoryId,
      }
    );
  }

  async function saveItem(
    id: string,
    payload: Parameters<typeof updateCatalogItem>[1]
  ) {
    setSavingId(id);
    try {
      await updateCatalogItem(id, payload);
      onSaved();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao guardar");
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreate() {
    const price = parseFloat(newItem.price.replace(",", "."));
    if (!newItem.name.trim()) {
      alert("Nome obrigatório");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      alert("Preço inválido");
      return;
    }

    setSavingId("new");
    try {
      await createCatalogItem({
        name: newItem.name.trim(),
        price,
        categoryId:
          newItem.type === "extra" ? "acompanhamentos" : newItem.categoryId,
        skipKitchen: newItem.type === "bebida",
        isAddon: newItem.type === "extra",
      });
      setNewItem({
        name: "",
        price: "",
        categoryId: category,
        type: "comida",
      });
      setShowNew(false);
      onSaved();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao criar");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(item: MenuItem) {
    if (
      !confirm(
        `Remover "${item.name}" do catálogo? Esta acção não pode ser desfeita.`
      )
    ) {
      return;
    }
    setSavingId(item.id);
    try {
      await deleteCatalogItem(item.id);
      onSaved();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao remover");
    } finally {
      setSavingId(null);
    }
  }

  function itemTypeLabel(item: MenuItem) {
    if (item.isAddon) return "Extra";
    if (item.skipKitchen) return "Bebida";
    if (item.optionGroups?.length) return "Com personalização";
    return "Comida";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <input
          className="input max-w-md flex-1 min-w-[200px]"
          placeholder="Pesquisar produto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={() => setShowNew((v) => !v)}
          className="btn-primary btn-sm"
        >
          {showNew ? "Cancelar" : "+ Novo produto"}
        </button>
      </div>

      {showNew && (
        <div className="card space-y-3 border-brand-gold/30">
          <p className="text-sm font-bold text-brand-gold">Novo produto</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              className="input text-sm"
              placeholder="Nome"
              value={newItem.name}
              onChange={(e) =>
                setNewItem((n) => ({ ...n, name: e.target.value }))
              }
            />
            <input
              className="input text-sm"
              placeholder="Preço"
              inputMode="decimal"
              value={newItem.price}
              onChange={(e) =>
                setNewItem((n) => ({ ...n, price: e.target.value }))
              }
            />
            <select
              className="input text-sm"
              value={newItem.type}
              onChange={(e) =>
                setNewItem((n) => ({
                  ...n,
                  type: e.target.value as typeof newItem.type,
                }))
              }
            >
              <option value="comida">Comida (cozinha)</option>
              <option value="bebida">Bebida (bar)</option>
              <option value="extra">Extra (ovo, batata…)</option>
            </select>
            {newItem.type !== "extra" && (
              <select
                className="input text-sm"
                value={newItem.categoryId}
                onChange={(e) =>
                  setNewItem((n) => ({ ...n, categoryId: e.target.value }))
                }
              >
                {(newItem.type === "bebida"
                  ? catalog.categories.filter((c) =>
                      ["bebidas", "cervejas", "cervejas-estrangeiras", "vinhos", "sangrias", "gins"].includes(
                        c.id
                      )
                    )
                  : editableCategories
                ).map((cat: MenuCategory) => (
                  <option key={cat.id} value={cat.id}>
                    {CATEGORY_SHORT[cat.id] ?? cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={handleCreate}
            disabled={savingId === "new"}
            className="btn-primary btn-sm"
          >
            Criar produto
          </button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {catalog.categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`rounded-xl px-3 py-2 text-xs font-bold min-h-[40px] ${
              category === cat.id
                ? "bg-brand-gold text-white"
                : "bg-brand-card text-brand-muted border border-brand-gold/10"
            }`}
          >
            {CATEGORY_SHORT[cat.id] ?? cat.name}
            <span className="ml-1 opacity-60">
              (
              {catalog.items.filter((i) => i.categoryId === cat.id).length})
            </span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-center text-brand-muted py-8">
          Nenhum produto nesta categoria
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const draft = getDraft(item);
            const inactive = item.active === false;
            const busy = savingId === item.id;

            return (
              <div
                key={item.id}
                className={`card space-y-3 ${inactive ? "opacity-50" : ""}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-brand-muted">
                    {itemTypeLabel(item)}
                  </span>
                  {item.optionGroups?.length ? (
                    <span className="text-[10px] text-brand-muted">
                      Opções fixas (carne/pão)
                    </span>
                  ) : null}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input
                    className="input text-sm py-2 min-h-[40px]"
                    value={draft.name}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [item.id]: { ...draft, name: e.target.value },
                      }))
                    }
                  />
                  <input
                    className="input text-sm text-right py-2 min-h-[40px]"
                    inputMode="decimal"
                    value={draft.price}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [item.id]: { ...draft, price: e.target.value },
                      }))
                    }
                  />
                  {!item.isAddon && (
                    <select
                      className="input text-sm py-2 min-h-[40px]"
                      value={draft.categoryId}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [item.id]: {
                            ...draft,
                            categoryId: e.target.value,
                          },
                        }))
                      }
                    >
                      {catalog.categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {CATEGORY_SHORT[cat.id] ?? cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      saveItem(item.id, {
                        name: draft.name,
                        price: parseFloat(draft.price.replace(",", ".")),
                        categoryId: item.isAddon
                          ? undefined
                          : draft.categoryId,
                      })
                    }
                    disabled={busy}
                    className="btn-secondary btn-sm"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => saveItem(item.id, { active: !inactive })}
                    disabled={busy}
                    className={`btn-sm ${inactive ? "btn-primary" : "btn-ghost"}`}
                  >
                    {inactive ? "Activar" : "Ocultar"}
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={busy}
                    className="btn-danger btn-sm"
                  >
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminView() {
  const [section, setSection] = useState<AdminSection>("relatorios");
  const [period, setPeriod] = useState<AnalyticsPeriod>("day");
  const [anchorDate, setAnchorDate] = useState(() => toDateParam(new Date()));
  const [kpis, setKpis] = useState<AdminKPIs | null>(null);
  const [history, setHistory] = useState<OrderHistoryEntry[]>([]);
  const [catalog, setCatalog] = useState<MenuCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (section === "relatorios") {
        setKpis(await fetchAdminAnalytics(period, anchorDate));
      } else if (section === "historico") {
        setHistory(await fetchAdminHistory(period, { date: anchorDate }));
      } else {
        setCatalog(await fetchAdminCatalog());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [section, period, anchorDate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const meta = SECTION_META[section];
  const showPeriod = section === "relatorios" || section === "historico";

  return (
    <AdminLayout
      section={section}
      onSection={setSection}
      title={meta.title}
      subtitle={meta.subtitle}
    >
      {showPeriod && (
        <PeriodSelector
          period={period}
          anchorDate={anchorDate}
          onPeriodChange={setPeriod}
          onDateChange={setAnchorDate}
        />
      )}

      {error && (
        <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-brand-muted">
          A carregar…
        </div>
      ) : section === "relatorios" && kpis ? (
        <ReportsSection kpis={kpis} />
      ) : section === "historico" ? (
        <HistorySection history={history} period={period} anchorDate={anchorDate} />
      ) : section === "catalogo" && catalog ? (
        <CatalogSection catalog={catalog} onSaved={loadData} />
      ) : null}
    </AdminLayout>
  );
}
