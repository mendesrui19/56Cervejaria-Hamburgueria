"use client";

import { BUSINESS } from "@/data/landing";
import { useLandingLocale } from "@/contexts/LandingLocaleContext";
import { GlovoLogo } from "@/components/landing/GlovoLogo";
import { GlovoPreviewCard } from "@/components/landing/GlovoPreviewCard";

export function GlovoDeliverySection() {
  const { copy } = useLandingLocale();

  return (
    <section id="glovo" className="glovo-delivery-section">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="glovo-section-grid">
          <div className="glovo-section-copy">
            <p className="glovo-section-eyebrow">{copy.glovo.eyebrow}</p>
            <h2 className="glovo-section-title">{copy.glovo.title}</h2>
            <p className="glovo-section-subtitle">{copy.glovo.subtitle}</p>
            <p className="glovo-section-note">{copy.glovo.note}</p>
            <a
              href={BUSINESS.glovoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glovo-section-cta"
              aria-label={`${copy.glovo.cta} Glovo`}
            >
              <span>{copy.glovo.cta}</span>
              <GlovoLogo className="glovo-section-cta-logo" />
            </a>
          </div>

          <a
            href={BUSINESS.glovoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="glovo-preview-link"
            aria-label={`${copy.glovo.cta} Glovo`}
          >
            <GlovoPreviewCard />
          </a>
        </div>
      </div>
    </section>
  );
}
