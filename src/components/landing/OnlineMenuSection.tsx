"use client";

import Link from "next/link";
import { MenuBookCoverPreview } from "@/components/menu/MenuBookCoverPreview";
import { useLandingLocale } from "@/contexts/LandingLocaleContext";

export function OnlineMenuSection() {
  const { copy } = useLandingLocale();

  return (
    <section id="menu" className="menu-book-section">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="menu-section-grid">
          <div className="menu-section-copy">
            <p className="menu-section-eyebrow">{copy.menu.eyebrow}</p>
            <h2 className="menu-section-title">{copy.menu.title}</h2>
            <p className="menu-section-subtitle">{copy.menu.subtitle}</p>
            <p className="menu-section-note">{copy.menu.qrHint}</p>
            <Link href="/carta" className="menu-section-cta">
              {copy.menu.openFull}
            </Link>
            <Link href="/fidelizacao" className="menu-section-cta mt-3 inline-block opacity-90">
              Cartão de fidelização
            </Link>
          </div>

          <MenuBookCoverPreview />
        </div>
      </div>
    </section>
  );
}
