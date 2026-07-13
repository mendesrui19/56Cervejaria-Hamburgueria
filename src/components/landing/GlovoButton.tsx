"use client";

import { BUSINESS } from "@/data/landing";
import { useLandingLocale } from "@/contexts/LandingLocaleContext";
import { GlovoLogo } from "@/components/landing/GlovoLogo";

interface GlovoButtonProps {
  className?: string;
  compact?: boolean;
}

export function GlovoButton({ className = "", compact = false }: GlovoButtonProps) {
  const { copy } = useLandingLocale();

  return (
    <a
      href={BUSINESS.glovoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`landing-glovo-btn ${compact ? "is-compact" : ""} ${className}`}
      aria-label={copy.nav.glovo}
    >
      <GlovoLogo className="landing-glovo-logo" />
    </a>
  );
}
