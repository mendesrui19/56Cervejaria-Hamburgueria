"use client";

import type { LoyaltyMemberProfile } from "@/lib/loyalty";
import { LOYALTY_MILESTONES } from "@/lib/loyalty";

export function LoyaltyRewardsRail({
  member,
  onRedeem,
}: {
  member: LoyaltyMemberProfile;
  onRedeem: (rewardId: number) => void;
}) {
  const available = member.rewards.filter((r) => !r.redeemedAt);

  return (
    <section className="loyalty-rewards-rail">
      <div className="loyalty-section-head">
        <div>
          <p className="loyalty-section-kicker">Recompensas</p>
          <h2 className="loyalty-section-title">Por selos totais</h2>
        </div>
        {available.length > 0 && (
          <span className="loyalty-pill">{available.length} disponíveis</span>
        )}
      </div>

      <div className="loyalty-tier-grid">
        {LOYALTY_MILESTONES.map((milestone) => {
          const tier = member.tierProgress.find((t) => t.type === milestone.type);
          const progress = tier
            ? Math.min(100, (tier.lifetimeStamps / tier.target) * 100)
            : 0;
          const reached = tier?.reached ?? false;

          return (
            <article
              key={milestone.type}
              className={`loyalty-tier-card ${reached ? "is-reached" : ""}`}
            >
              <p className="loyalty-tier-target">{milestone.lifetimeStamps} selos</p>
              <p className="loyalty-tier-label">{milestone.label}</p>
              <div className="loyalty-tier-track">
                <div
                  className="loyalty-tier-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="loyalty-tier-meta">
                {member.lifetimeStamps}/{milestone.lifetimeStamps}
              </p>
            </article>
          );
        })}
      </div>

      {available.length > 0 && (
        <div className="loyalty-available-strip">
          {available.slice(0, 4).map((reward) => (
            <div key={reward.id} className="loyalty-available-chip">
              <div className="min-w-0">
                <p className="loyalty-available-label">{reward.label}</p>
                <p className="loyalty-available-date">
                  {new Date(reward.unlockedAt).toLocaleDateString("pt-PT")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRedeem(reward.id)}
                className="loyalty-btn-ghost"
              >
                Usar
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
