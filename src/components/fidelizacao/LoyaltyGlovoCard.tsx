"use client";

import Image from "next/image";
import { BUSINESS } from "@/data/landing";

export function LoyaltyGlovoCard() {
  return (
    <a
      href={BUSINESS.glovoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="loyalty-glovo-card"
      aria-label="Pedir na Glovo"
    >
      <div className="loyalty-glovo-copy">
        <p className="loyalty-section-kicker">Delivery</p>
        <h2 className="loyalty-glovo-title">Pede em casa na Glovo</h2>
        <p className="loyalty-glovo-sub">
          Os teus hambúrgueres favoritos, à distância de um toque.
        </p>
        <span className="loyalty-glovo-cta">Abrir Glovo</span>
      </div>
      <div className="loyalty-glovo-badge">
        <Image
          src="/brand/glovo-logo.png"
          alt=""
          width={56}
          height={56}
          className="loyalty-glovo-logo"
        />
      </div>
    </a>
  );
}
