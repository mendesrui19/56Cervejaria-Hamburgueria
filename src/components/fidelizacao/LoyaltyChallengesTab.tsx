"use client";

import { LoyaltyChallenges } from "@/components/fidelizacao/LoyaltyChallenges";
import type { LoyaltyMemberProfile } from "@/lib/loyalty";

export function LoyaltyChallengesTab({
  member,
}: {
  member: LoyaltyMemberProfile;
}) {
  async function shareInvite() {
    const text = `Junta-te à App 56 da Cinquenta & Seis! Usa o meu link e ganhamos selos extra: ${member.inviteUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "App 56 — Cinquenta & Seis",
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

  return (
    <div className="loyalty-tab-panel">
      <LoyaltyChallenges member={member} />

      <section className="loyalty-invite-card">
        <p className="loyalty-section-kicker">Convidar amigos</p>
        <h2 className="loyalty-section-title">Ganha selos a partilhar</h2>
        <p className="loyalty-invite-copy">
          Partilha o teu link. Quando um amigo criar cartão e visitar, ambos
          ganham bónus.
        </p>
        <p className="loyalty-invite-code">{member.memberCode}</p>
        <button
          type="button"
          onClick={() => void shareInvite()}
          className="loyalty-btn-primary w-full"
        >
          Partilhar convite
        </button>
      </section>
    </div>
  );
}
