"use client";

import { LoyaltyAvatar } from "@/components/fidelizacao/LoyaltyAvatar";
import { LoyaltyChallenges } from "@/components/fidelizacao/LoyaltyChallenges";
import { LoyaltyRewardsRail } from "@/components/fidelizacao/LoyaltyRewardsRail";
import { StampGrid } from "@/components/fidelizacao/StampGrid";
import type { LoyaltyMemberProfile } from "@/lib/loyalty";

export function LoyaltyCardTab({
  member,
  pulseIndex,
  onOpenQr,
  onRedeem,
}: {
  member: LoyaltyMemberProfile;
  pulseIndex?: number | null;
  onOpenQr: () => void;
  onRedeem: (rewardId: number) => void;
}) {
  const remaining = Math.max(0, member.stampsTarget - member.currentStamps);

  return (
    <div className="loyalty-tab-panel">
      <section className="loyalty-hero-card">
        <div className="loyalty-hero-top">
          <LoyaltyAvatar member={member} size="md" />
          <div className="min-w-0 flex-1">
            <p className="loyalty-hero-greeting">Olá, {member.name.split(" ")[0]}</p>
            <h2 className="loyalty-hero-stamps">
              {member.currentStamps}
              <span className="loyalty-hero-stamps-total">/{member.stampsTarget}</span>
            </h2>
            <p className="loyalty-hero-meta">
              {remaining === 0
                ? "Cartão completo — recompensa desbloqueada"
                : `Faltam ${remaining} selos para entrada grátis`}
            </p>
          </div>
          <button type="button" onClick={onOpenQr} className="loyalty-qr-fab">
            QR
          </button>
        </div>

        <StampGrid
          current={member.currentStamps}
          target={member.stampsTarget}
          pulseIndex={pulseIndex}
        />

        {member.bonusEligible && (
          <div className="loyalty-bonus-banner mt-4">
            Próxima visita: +{member.bonusStamps} selos (desafio mensal)
          </div>
        )}
      </section>

      <LoyaltyRewardsRail member={member} onRedeem={onRedeem} />
      <LoyaltyChallenges member={member} />
    </div>
  );
}
