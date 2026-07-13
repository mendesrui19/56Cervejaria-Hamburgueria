"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLandingLocale } from "@/contexts/LandingLocaleContext";
import { GlovoLogo } from "@/components/landing/GlovoLogo";
import { BUSINESS, HERO_VIDEO } from "@/data/landing";
import { getOpenStatus } from "@/lib/landing-hours";

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { locale, copy } = useLandingLocale();
  const [openStatus, setOpenStatus] = useState(() =>
    getOpenStatus(undefined, locale)
  );
  const [useVideo, setUseVideo] = useState(true);

  useEffect(() => {
    const startVideo = () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      setUseVideo(!reduced);
      if (reduced) return;
      videoRef.current?.play().catch(() => setUseVideo(false));
    };

    if (!document.documentElement.classList.contains("site-ready")) {
      window.addEventListener("site-loader:done", startVideo, { once: true });
      return () =>
        window.removeEventListener("site-loader:done", startVideo);
    }

    startVideo();
  }, []);

  useEffect(() => {
    setOpenStatus(getOpenStatus(undefined, locale));
    const timer = window.setInterval(
      () => setOpenStatus(getOpenStatus(undefined, locale)),
      60_000
    );
    return () => window.clearInterval(timer);
  }, [locale]);

  return (
    <section className="landing-hero" aria-label="Início">
      <div className="landing-hero-media">
        {useVideo ? (
          <video
            ref={videoRef}
            className="landing-hero-video"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={HERO_VIDEO.poster}
            aria-hidden="true"
          >
            <source src={HERO_VIDEO.src} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={HERO_VIDEO.poster}
            alt=""
            fill
            priority
            quality={92}
            className="landing-hero-image"
            sizes="100vw"
          />
        )}
        <div className="landing-hero-overlay" aria-hidden="true" />
        <div className="landing-hero-grain" aria-hidden="true" />
      </div>

      <div className="landing-hero-content">
        <div className="landing-hero-inner">
          <div className="landing-hero-status">
            <span
              className={`landing-hero-status-dot ${
                openStatus.isOpen ? "is-open" : ""
              }`}
              aria-hidden="true"
            />
            <span className="landing-hero-status-text">
              {openStatus.label}
              <span className="landing-hero-status-sep">·</span>
              {openStatus.detail}
            </span>
          </div>

          <p className="landing-hero-eyebrow">{copy.hero.tagline}</p>

          <h1 className="landing-hero-title">
            <span className="landing-hero-title-line">
              {copy.hero.titleLine1}
            </span>
            <span className="landing-hero-title-line landing-hero-title-accent">
              {copy.hero.titleLine2}
            </span>
          </h1>

          <p className="landing-hero-lead">{copy.hero.description}</p>

          <div className="landing-hero-actions">
            <a href={BUSINESS.phoneHref} className="landing-hero-cta-primary">
              {copy.nav.bookNav}
            </a>
            <a href="#menu" className="landing-hero-cta-secondary">
              {copy.hero.viewMenu}
            </a>
          </div>

          <div className="landing-hero-meta">
            <span className="landing-hero-meta-item">
              <strong>{BUSINESS.googleRatingLabel}</strong>
              <span>Google · {BUSINESS.googleReviewCount}+</span>
            </span>
            <span className="landing-hero-meta-divider" aria-hidden="true" />
            <span className="landing-hero-meta-item">
              <strong>{copy.hero.since}</strong>
              <span>{copy.hero.sinceLabel}</span>
            </span>
            <span className="landing-hero-meta-divider" aria-hidden="true" />
            <a
              href={BUSINESS.glovoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="landing-hero-glovo-btn"
              aria-label={`${copy.hero.glovoOrder} Glovo`}
            >
              <span className="landing-hero-glovo-label">{copy.hero.glovoOrder}</span>
              <GlovoLogo className="landing-hero-glovo-logo" />
            </a>
          </div>
        </div>
      </div>

      <a href="#sobre" className="landing-hero-scroll" aria-label={copy.hero.scrollHint}>
        <span>{copy.hero.scrollHint}</span>
        <span className="landing-hero-scroll-line" aria-hidden="true" />
      </a>
    </section>
  );
}
