"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminAuditLog } from "@/components/admin/AdminAuditLog";
import { AdminHistory } from "@/components/admin/AdminHistory";
import { AdminLayout, type AdminSection } from "@/components/admin/AdminLayout";
import { AdminLoyalty } from "@/components/admin/AdminLoyalty";
import { AdminReports } from "@/components/admin/AdminReports";
import { AdminTableMap } from "@/components/admin/AdminTableMap";
import { PeriodSelector } from "@/components/admin/PeriodSelector";
import {
  createCatalogItem,
  deleteCatalogItem,
  fetchAdminAnalytics,
  fetchAdminAudit,
  fetchAdminCatalog,
  fetchAdminHistory,
  updateCatalogItem,
} from "@/lib/api";
import { FEATURE_LOYALTY } from "@/lib/feature-flags";
import { CATEGORY_SHORT } from "@/lib/menu";
import { toDateParam } from "@/lib/period";
import type {
  AdminKPIs,
  AnalyticsPeriod,
  AuditLogEntry,
  MenuCatalog,
  MenuCategory,
  MenuItem,
  OrderHistoryEntry,
} from "@/lib/types";

const SECTION_META: Record<
  AdminSection,
  { title: string; subtitle: string }
> = {
  relatorios: {
    title: "Dashboard",
    subtitle: "O que importa para gerir o serviço",
  },
  operacoes: {
    title: "Operações",
    subtitle: "Mapa de mesas em tempo real",
  },
  historico: {
    title: "Histórico",
    subtitle: "Contas fechadas com detalhe e exportação",
  },
  auditoria: {
    title: "Auditoria",
    subtitle: "Cancelamentos, transferências e anulações",
  },
  fidelizacao: {
    title: "App 56",
    subtitle: "Membros, selos e impacto da app de clientes",
  },
  catalogo: {
    title: "Catálogo",
    subtitle: "Adicionar, editar e remover produtos",
  },
};

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
                      [
                        "bebidas",
                        "cervejas",
                        "cervejas-estrangeiras",
                        "vinhos",
                        "sangrias",
                        "gins",
                      ].includes(c.id)
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
              ({catalog.items.filter((i) => i.categoryId === cat.id).length})
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
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (section === "operacoes" || section === "fidelizacao") {
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (section === "relatorios") {
        setKpis(await fetchAdminAnalytics(period, anchorDate));
      } else if (section === "historico") {
        setHistory(await fetchAdminHistory(period, { date: anchorDate }));
      } else if (section === "auditoria") {
        setAuditLogs(await fetchAdminAudit());
      } else if (section === "catalogo") {
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

  useEffect(() => {
    if (!FEATURE_LOYALTY && section === "fidelizacao") {
      setSection("relatorios");
    }
  }, [section]);

  const meta = SECTION_META[section];
  const showPeriod = section === "relatorios" || section === "historico";
  const showLive =
    section === "relatorios" &&
    period === "day" &&
    anchorDate === toDateParam(new Date());

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

      {loading && section !== "operacoes" && section !== "fidelizacao" ? (
        <div className="flex items-center justify-center py-24 text-brand-muted">
          A carregar…
        </div>
      ) : section === "operacoes" ? (
        <AdminTableMap />
      ) : section === "relatorios" && kpis ? (
        <AdminReports
          kpis={kpis}
          anchorDate={anchorDate}
          showLive={showLive}
        />
      ) : section === "historico" ? (
        <AdminHistory
          history={history}
          period={period}
          anchorDate={anchorDate}
        />
      ) : section === "auditoria" ? (
        <AdminAuditLog logs={auditLogs} />
      ) : section === "fidelizacao" ? (
        <AdminLoyalty />
      ) : section === "catalogo" && catalog ? (
        <CatalogSection catalog={catalog} onSaved={loadData} />
      ) : null}
    </AdminLayout>
  );
}
