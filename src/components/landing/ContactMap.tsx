"use client";

import { useLandingLocale } from "@/contexts/LandingLocaleContext";
import { BUSINESS } from "@/data/landing";

export function ContactMap() {
  const { copy } = useLandingLocale();

  return (
    <div className="landing-contact-map-wrap h-full flex flex-col">
      <iframe
        src={BUSINESS.mapsEmbedUrl}
        title="Localização Cinquenta & Seis em Fafe"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="landing-contact-map flex-1 min-h-[16rem]"
      />
      <div className="landing-contact-map-footer">
        <p className="landing-contact-map-address">
          {BUSINESS.address}
          <br />
          {BUSINESS.city}
        </p>
        <a
          href={BUSINESS.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="landing-contact-map-link"
        >
          {copy.contact.viewMap}
        </a>
      </div>
    </div>
  );
}
