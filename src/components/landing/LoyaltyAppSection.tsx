"use client";

import Image from "next/image";
import Link from "next/link";
import { RevealSection } from "@/components/landing/RevealSection";
import { useLandingLocale } from "@/contexts/LandingLocaleContext";

export function LoyaltyAppSection() {
  const { copy } = useLandingLocale();

  return (
    <RevealSection id="app" className="landing-app-section">
      <div className="landing-app-glow" aria-hidden="true" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
        <div className="landing-app-grid">
          <div className="landing-app-copy landing-reveal">
            <p className="landing-app-eyebrow">{copy.app.eyebrow}</p>
            <h2 className="landing-app-title">
              {copy.app.titleLine1}
              <br />
              {copy.app.titleLine2}
            </h2>
            <p className="landing-app-description">{copy.app.description}</p>

            <ul className="landing-app-points">
              <li>{copy.app.point1}</li>
              <li>{copy.app.point2}</li>
            </ul>

            <div className="landing-app-actions">
              <Link href="/app-promo" className="landing-app-cta">
                {copy.app.cta}
              </Link>
            </div>
          </div>

          <div className="landing-app-visual landing-reveal landing-reveal-delay">
            <Image
              src="/brand/selo-stamp.png"
              alt=""
              width={120}
              height={120}
              className="landing-app-seal landing-app-seal--1"
              aria-hidden
            />
            <Image
              src="/brand/selo-stamp.png"
              alt=""
              width={88}
              height={88}
              className="landing-app-seal landing-app-seal--2"
              aria-hidden
            />
            <Image
              src="/brand/app56-mockup.png"
              alt={copy.app.imageAlt}
              width={449}
              height={556}
              className="landing-app-mockup"
              sizes="(max-width: 1024px) 80vw, 420px"
              priority={false}
            />
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
