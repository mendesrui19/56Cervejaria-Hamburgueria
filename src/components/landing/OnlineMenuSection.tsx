"use client";

import Link from "next/link";
import { MenuBookCoverPreview } from "@/components/menu/MenuBookCoverPreview";
import { useLandingLocale } from "@/contexts/LandingLocaleContext";
import { FEATURE_LOYALTY } from "@/lib/feature-flags";

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
            <div className="menu-section-cta-group">
              <Link href="/carta" className="menu-section-cta">
                {copy.menu.openFull}
              </Link>
              {FEATURE_LOYALTY ? (
                <Link href="/app-promo" className="menu-section-cta menu-section-cta--secondary">
                  App 56
                </Link>
              ) : null}
            </div>
          </div>

          <MenuBookCoverPreview />
        </div>
      </div>
    </section>
  );
}
