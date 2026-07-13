"use client";

import Image from "next/image";
import { useLandingLocale } from "@/contexts/LandingLocaleContext";
import { GlovoLogo } from "@/components/landing/GlovoLogo";

export function GlovoPreviewCard() {
  const { copy } = useLandingLocale();

  return (
    <div className="glovo-preview" aria-hidden="true">
      <div className="glovo-preview-shadow" />
      <div className="glovo-preview-card">
        <div className="glovo-preview-badge">
          <GlovoLogo className="glovo-preview-logo" />
        </div>
        <div className="glovo-preview-photo">
          <Image
            src="/fotos/01.webp"
            alt=""
            fill
            className="object-cover"
            sizes="280px"
          />
        </div>
        <div className="glovo-preview-body">
          <p className="glovo-preview-store">Cinquenta & Seis</p>
          <p className="glovo-preview-meta">Hamburgueria · Fafe</p>
          <div className="glovo-preview-tags">
            <span>Entrega</span>
            <span>30–45 min</span>
          </div>
        </div>
      </div>
      <span className="glovo-preview-hint">{copy.glovo.tapToOrder}</span>
    </div>
  );
}
