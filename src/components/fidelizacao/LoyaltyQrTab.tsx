"use client";

import { MemberQr } from "@/components/fidelizacao/MemberQr";
import type { LoyaltyMemberProfile } from "@/lib/loyalty";

export function LoyaltyQrTab({ member }: { member: LoyaltyMemberProfile }) {
  return (
    <div className="loyalty-tab-panel">
      <section className="loyalty-qr-hero">
        <p className="loyalty-section-kicker">Na caixa</p>
        <h2 className="loyalty-section-title">Mostra o teu QR</h2>
        <p className="loyalty-qr-copy">
          Apresenta este código ao empregado para registar a visita e ganhar selos.
        </p>
        <MemberQr memberCode={member.memberCode} large />
        <p className="loyalty-code-label">{member.memberCode}</p>
      </section>
    </div>
  );
}
