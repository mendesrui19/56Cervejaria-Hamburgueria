"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { useLandingLocale } from "@/contexts/LandingLocaleContext";
import { BUSINESS } from "@/data/landing";

type LandingNavbarProps = {
  /** Prefix for section anchors when not on the home page (e.g. "/"). */
  sectionPrefix?: string;
  /** Optional side CTA, e.g. Abrir app. */
  openAppHref?: string;
  openAppLabel?: string;
};

export function LandingNavbar({
  sectionPrefix = "",
  openAppHref,
  openAppLabel = "Abrir app",
}: LandingNavbarProps) {
  const { copy } = useLandingLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navLinks = useMemo(
    () => [
      { href: `${sectionPrefix}#sobre`, label: copy.nav.about },
      { href: `${sectionPrefix}#menu`, label: copy.nav.menu },
      { href: `${sectionPrefix}#galeria`, label: copy.nav.gallery },
      { href: `${sectionPrefix}#opinioes`, label: copy.nav.reviews },
      { href: `${sectionPrefix}#cervejaria`, label: copy.nav.brewery },
      { href: `${sectionPrefix}#app`, label: copy.nav.app },
      { href: `${sectionPrefix}#contacto`, label: copy.nav.contact },
    ],
    [copy, sectionPrefix]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={`landing-nav fixed inset-x-0 top-0 z-50 safe-top ${
        scrolled ? "is-scrolled" : ""
      }`}
    >
      <div className="landing-nav-bar">
        <div className="landing-nav-container">
          <Link href="/" className="landing-nav-brand">
            <Image
              src="/brand/logo.png"
              alt=""
              width={40}
              height={40}
              className="landing-nav-logo"
              priority
            />
            <span className="landing-nav-brand-text">
              <span className="landing-nav-name">Cinquenta & Seis</span>
              <span className="landing-nav-tagline-row">
                <span className="landing-nav-tagline-line" aria-hidden="true" />
                <span className="landing-nav-tagline">hamburgueria & cervejaria</span>
                <span className="landing-nav-tagline-line" aria-hidden="true" />
              </span>
            </span>
          </Link>

          <div className="landing-nav-right">
            <nav className="landing-nav-links" aria-label="Principal">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="landing-nav-link">
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="landing-nav-actions">
              <LanguageSwitcher />
              {openAppHref ? (
                <Link href={openAppHref} className="landing-nav-app">
                  {openAppLabel}
                </Link>
              ) : null}
              <a href={BUSINESS.phoneHref} className="landing-nav-reserva landing-nav-reserva-solid">
                {copy.nav.bookNav}
              </a>
            </div>
          </div>

          <div className="landing-nav-mobile-actions">
            <LanguageSwitcher />
            {openAppHref ? (
              <Link href={openAppHref} className="landing-nav-app landing-nav-app-compact">
                {openAppLabel}
              </Link>
            ) : null}
            <a href={BUSINESS.phoneHref} className="landing-nav-reserva landing-nav-reserva-solid">
              {copy.nav.bookNav}
            </a>
          </div>

          <button
            type="button"
            className="landing-nav-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={copy.nav.openMenu}
          >
            <span className="landing-nav-toggle-bar" />
            <span className="landing-nav-toggle-bar" />
          </button>
        </div>
      </div>

      <div
        className={`landing-nav-drawer ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="landing-nav-drawer-backdrop" onClick={() => setMenuOpen(false)} />
        <div className="landing-nav-drawer-panel">
          <nav className="landing-nav-drawer-links">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="landing-nav-drawer-link"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="landing-nav-drawer-footer">
            <LanguageSwitcher />
            {openAppHref ? (
              <Link
                href={openAppHref}
                onClick={() => setMenuOpen(false)}
                className="landing-nav-app landing-nav-app-full"
              >
                {openAppLabel}
              </Link>
            ) : null}
            <a
              href={BUSINESS.phoneHref}
              onClick={() => setMenuOpen(false)}
              className="landing-nav-reserva landing-nav-reserva-solid landing-nav-reserva-full"
            >
              {copy.nav.bookNav}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
