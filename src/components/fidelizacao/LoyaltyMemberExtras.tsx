"use client";

import {
  LOYALTY_MONTHLY_MEALS_FOR_BONUS,
  type LoyaltyMemberProfile,
} from "@/lib/loyalty";

function formatVisitDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
  });
}

const LEVEL_CLASS: Record<string, string> = {
  bronze: "loyalty-level-bronze",
  prata: "loyalty-level-prata",
  ouro: "loyalty-level-ouro",
};

export function LoyaltyMemberExtras({ member }: { member: LoyaltyMemberProfile }) {
  async function shareInvite() {
    const text = `Junta-te ao cartão de fidelização da Cinquenta & Seis! Usa o meu link e ganhamos selos extra: ${member.inviteUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Cartão Cinquenta & Seis",
          text,
          url: member.inviteUrl,
        });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(member.inviteUrl);
    alert("Link copiado! Partilha com um amigo.");
  }

  const monthlyProgress = Math.min(
    member.mealsThisMonth,
    LOYALTY_MONTHLY_MEALS_FOR_BONUS
  );

  return (
    <div className="loyalty-extras space-y-3">
      <div className="loyalty-stats-row">
        <p className="text-sm text-white/70">
          Visitaste{" "}
          <span className="text-white font-bold">{member.totalVisits}</span>{" "}
          vezes
          {member.lastVisitAt && (
            <>
              {" "}
              · última:{" "}
              <span className="text-brand-gold font-semibold">
                {formatVisitDate(member.lastVisitAt)}
              </span>
            </>
          )}
        </p>
        <span
          className={`loyalty-level-badge ${LEVEL_CLASS[member.level.id] ?? ""}`}
        >
          {member.level.label}
        </span>
      </div>

      <div className="loyalty-challenge-card">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-black uppercase tracking-widest text-amber-200">
            Desafio mensal
          </p>
          <p className="text-xs text-white/50">
            {monthlyProgress}/{LOYALTY_MONTHLY_MEALS_FOR_BONUS}
          </p>
        </div>
        <div className="loyalty-progress-track">
          <div
            className="loyalty-progress-fill"
            style={{
              width: `${(monthlyProgress / LOYALTY_MONTHLY_MEALS_FOR_BONUS) * 100}%`,
            }}
          />
        </div>
        <p className="text-xs text-white/60 mt-2 leading-relaxed">
          {member.bonusEligible
            ? `Próxima visita: +${member.bonusStamps} selos de uma vez!`
            : `Faz ${LOYALTY_MONTHLY_MEALS_FOR_BONUS} visitas este mês — a seguinte dá +${member.bonusStamps} selos`}
        </p>
      </div>

      <div className="loyalty-challenge-card">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-200">
            Racha semanal
          </p>
          <p className="text-xs text-white/50">
            {Math.min(member.streakWeeks, member.streakTarget)}/
            {member.streakTarget}
          </p>
        </div>
        <div className="loyalty-progress-track loyalty-progress-track-green">
          <div
            className="loyalty-progress-fill loyalty-progress-fill-green"
            style={{
              width: `${(Math.min(member.streakWeeks, member.streakTarget) / member.streakTarget) * 100}%`,
            }}
          />
        </div>
        <p className="text-xs text-white/60 mt-2">
          {member.streakEligible
            ? "Visita esta semana e ganhas selo extra de racha!"
            : `${member.streakTarget} semanas seguidas com visita = selo extra`}
        </p>
      </div>

      {member.birthdayActive && (
        <div className="loyalty-bonus-banner">
          Aniversário — entrada grátis na próxima visita à caixa
        </div>
      )}

      <div className="loyalty-challenge-card">
        <p className="text-xs font-black uppercase tracking-widest text-brand-gold mb-3">
          Recompensas por selos totais
        </p>
        <div className="space-y-2">
          {member.tierProgress.map((tier) => (
            <div key={tier.type} className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  tier.reached ? "bg-brand-gold" : "bg-white/20"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${tier.reached ? "text-brand-gold font-bold" : "text-white/70"}`}
                >
                  {tier.label}
                </p>
                <p className="text-[10px] text-white/40">
                  {tier.lifetimeStamps}/{tier.target} selos totais
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button type="button" onClick={() => void shareInvite()} className="loyalty-btn-primary w-full">
        Convida um amigo (+1 selo para ambos)
      </button>
    </div>
  );
}
