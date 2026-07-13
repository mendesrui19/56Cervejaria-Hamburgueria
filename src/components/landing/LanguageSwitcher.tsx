"use client";

import { useLandingLocale } from "@/contexts/LandingLocaleContext";
import type { LandingLocale } from "@/data/landing-i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLandingLocale();

  const select = (next: LandingLocale) => {
    if (next !== locale) setLocale(next);
  };

  return (
    <div
      className="landing-lang-switch"
      role="group"
      aria-label="Idioma do site"
    >
      <button
        type="button"
        onClick={() => select("pt")}
        className={`landing-lang-option ${locale === "pt" ? "is-active" : ""}`}
        aria-pressed={locale === "pt"}
      >
        PT
      </button>
      <button
        type="button"
        onClick={() => select("en")}
        className={`landing-lang-option ${locale === "en" ? "is-active" : ""}`}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
