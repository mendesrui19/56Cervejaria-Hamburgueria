"use client";

import Image from "next/image";
import Link from "next/link";
import { useLandingLocale } from "@/contexts/LandingLocaleContext";

export function MenuBookCoverPreview() {
  const { copy } = useLandingLocale();

  return (
    <Link href="/carta" className="menu-cover-preview-link" aria-label={copy.menu.openFull}>
      <div className="menu-cover-preview">
        <div className="menu-cover-shadow" aria-hidden="true" />
        <div className="menu-cover-book">
          <div className="menu-cover-spine" aria-hidden="true">
            <span className="menu-cover-spine-line" />
          </div>
          <div className="menu-cover-face">
            <div className="menu-cover-frame" aria-hidden="true" />
            <div className="menu-cover-texture" aria-hidden="true" />
            <div className="menu-cover-content">
              <Image
                src="/brand/logo.png"
                alt=""
                width={88}
                height={88}
                className="menu-cover-logo"
              />
              <p className="menu-cover-title">Cinquenta & Seis</p>
              <div className="menu-cover-tagline-row">
                <span className="menu-cover-line" aria-hidden="true" />
                <span className="menu-cover-tagline">hamburgueria & cervejaria</span>
                <span className="menu-cover-line" aria-hidden="true" />
              </div>
              <p className="menu-cover-label">{copy.menu.eyebrow}</p>
            </div>
            <div className="menu-cover-shine" aria-hidden="true" />
          </div>
          <div className="menu-cover-edge" aria-hidden="true" />
        </div>
        <span className="menu-cover-hint">{copy.menu.tapToOpen}</span>
      </div>
    </Link>
  );
}
