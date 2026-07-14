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

export function LoyaltyChallenges({ member }: { member: LoyaltyMemberProfile }) {
  const monthlyProgress = Math.min(
    member.mealsThisMonth,
    LOYALTY_MONTHLY_MEALS_FOR_BONUS
  );
  const streakProgress = Math.min(member.streakWeeks, member.streakTarget);

  return (
    <section className="loyalty-challenges">
      <div className="loyalty-section-head">
        <div>
          <p className="loyalty-section-kicker">Actividade</p>
          <h2 className="loyalty-section-title">Desafios</h2>
        </div>
        <p className="loyalty-meta-inline">
          {member.totalVisits} visitas · última {formatVisitDate(member.lastVisitAt)}
        </p>
      </div>

      <div className="loyalty-challenge-grid">
        <article className="loyalty-challenge-tile">
          <div className="loyalty-challenge-top">
            <p className="loyalty-challenge-name">Desafio mensal</p>
            <span className="loyalty-challenge-count">
              {monthlyProgress}/{LOYALTY_MONTHLY_MEALS_FOR_BONUS}
            </span>
          </div>
          <div className="loyalty-progress-track">
            <div
              className="loyalty-progress-fill"
              style={{
                width: `${(monthlyProgress / LOYALTY_MONTHLY_MEALS_FOR_BONUS) * 100}%`,
              }}
            />
          </div>
          <p className="loyalty-challenge-copy">
            {member.bonusEligible
              ? `Próxima visita: +${member.bonusStamps} selos`
              : `${LOYALTY_MONTHLY_MEALS_FOR_BONUS} visitas no mês → +${member.bonusStamps} selos`}
          </p>
        </article>

        <article className="loyalty-challenge-tile">
          <div className="loyalty-challenge-top">
            <p className="loyalty-challenge-name">Racha semanal</p>
            <span className="loyalty-challenge-count">
              {streakProgress}/{member.streakTarget}
            </span>
          </div>
          <div className="loyalty-progress-track loyalty-progress-track-green">
            <div
              className="loyalty-progress-fill loyalty-progress-fill-green"
              style={{
                width: `${(streakProgress / member.streakTarget) * 100}%`,
              }}
            />
          </div>
          <p className="loyalty-challenge-copy">
            {member.streakEligible
              ? "Visita esta semana para selo extra"
              : `${member.streakTarget} semanas seguidas → selo extra`}
          </p>
        </article>
      </div>

      {member.birthdayActive && (
        <div className="loyalty-bonus-banner">
          Aniversário — entrada grátis na próxima visita à caixa
        </div>
      )}
    </section>
  );
}
