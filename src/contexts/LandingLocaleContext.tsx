"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LANDING_COPY,
  LANDING_LOCALE_KEY,
  type LandingCopy,
  type LandingLocale,
} from "@/data/landing-i18n";

interface LandingLocaleContextValue {
  locale: LandingLocale;
  copy: LandingCopy;
  setLocale: (locale: LandingLocale) => void;
}

const LandingLocaleContext = createContext<LandingLocaleContextValue | null>(
  null
);

function readStoredLocale(): LandingLocale {
  if (typeof window === "undefined") return "pt";
  const stored = window.localStorage.getItem(LANDING_LOCALE_KEY);
  return stored === "en" ? "en" : "pt";
}

export function LandingLocaleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<LandingLocale>("pt");

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  const setLocale = useCallback((next: LandingLocale) => {
    setLocaleState(next);
    window.localStorage.setItem(LANDING_LOCALE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      copy: LANDING_COPY[locale],
      setLocale,
    }),
    [locale, setLocale]
  );

  return (
    <LandingLocaleContext.Provider value={value}>
      {children}
    </LandingLocaleContext.Provider>
  );
}

export function useLandingLocale() {
  const ctx = useContext(LandingLocaleContext);
  if (!ctx) {
    throw new Error("useLandingLocale must be used within LandingLocaleProvider");
  }
  return ctx;
}
