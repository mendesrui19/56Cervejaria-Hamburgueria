"use client";

import { BUSINESS } from "@/data/landing";
import { useLandingLocale } from "@/contexts/LandingLocaleContext";
import { GlovoButton } from "@/components/landing/GlovoButton";

export function LandingMobileBar() {
  const { copy } = useLandingLocale();

  return (
    <div className="landing-mobile-bar md:hidden" aria-label="Acções rápidas">
      <GlovoButton compact className="landing-mobile-bar-glovo" />
      <a href={BUSINESS.phoneHref} className="landing-mobile-bar-btn landing-mobile-bar-btn-primary">
        {copy.mobileBar.book}
      </a>
      <a href="#contacto" className="landing-mobile-bar-btn">
        {copy.mobileBar.contact}
      </a>
    </div>
  );
}
