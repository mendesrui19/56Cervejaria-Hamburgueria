"use client";

import { useEffect, useState } from "react";
import { fetchAdminLoyaltyStats } from "@/lib/loyalty-api";
import type { LoyaltyAdminStats } from "@/lib/loyalty";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-line bg-white p-4">
      <p className="text-[11px] uppercase tracking-widest text-brand-muted font-bold">
        {label}
      </p>
      <p className="font-display text-2xl font-bold text-brand-gold mt-2 tabular-nums">
        {value}
      </p>
      {hint && <p className="text-xs text-brand-muted mt-1">{hint}</p>}
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AdminLoyalty() {
  const [stats, setStats] = useState<LoyaltyAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      try {
        setStats(await fetchAdminLoyaltyStats());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-brand-muted">
        A carregar fidelização…
      </div>
    );
  }

  if (error || !stats) {
    return (
      <p className="text-red-400 text-sm text-center py-12">
        {error || "Sem dados"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Membros totais" value={stats.totalMembers} />
        <StatCard
          label="Novos (7 dias)"
          value={stats.newMembersWeek}
          hint={`${stats.newMembersMonth} este mês`}
        />
        <StatCard
          label="Activos (30 dias)"
          value={stats.activeMembers30d}
          hint="Com pelo menos 1 visita"
        />
        <StatCard
          label="Selos hoje"
          value={stats.stampsToday}
          hint={`${stats.stampsWeek} na última semana`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard
          label="Recompensas por usar"
          value={stats.rewardsAvailable}
        />
        <StatCard
          label="Recompensas usadas"
          value={stats.rewardsRedeemedMonth}
          hint="Este mês"
        />
      </div>

      <section className="rounded-2xl border border-brand-line bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-line">
          <h3 className="font-display font-bold text-brand-gold">
            Registos recentes
          </h3>
          <p className="text-xs text-brand-muted mt-0.5">
            Últimos cartões criados na app
          </p>
        </div>

        {stats.recentMembers.length === 0 ? (
          <p className="text-brand-muted text-sm p-4">Ainda sem membros</p>
        ) : (
          <div className="divide-y divide-brand-line">
            {stats.recentMembers.map((row) => (
              <div
                key={row.id}
                className="px-4 py-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-bold text-brand-gold truncate">{row.name}</p>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {row.phone || "Sem telemóvel"} · {row.memberCode}
                  </p>
                  <p className="text-[11px] text-brand-muted mt-1">
                    Registo {formatDate(row.createdAt)}
                    {row.lastVisitAt
                      ? ` · última visita ${formatDate(row.lastVisitAt)}`
                      : " · ainda sem visitas"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-brand-gold tabular-nums">
                    {row.lifetimeStamps} selos
                  </p>
                  <p className="text-[11px] text-brand-muted">
                    {row.totalVisits} visita{row.totalVisits !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
