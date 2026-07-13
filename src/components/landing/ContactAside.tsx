"use client";

import Image from "next/image";
import { ContactMap } from "@/components/landing/ContactMap";

export function ContactAside() {
  return (
    <div className="landing-contact-aside landing-reveal landing-reveal-delay h-full">
      <div className="landing-contact-photo">
        <Image
          src="/fotos/05.webp"
          alt="Cinquenta & Seis"
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <div className="landing-contact-photo-overlay">
          <Image
            src="/brand/logo.png"
            alt=""
            width={120}
            height={120}
            className="landing-contact-photo-logo"
          />
          <p className="landing-contact-photo-title">Cinquenta & Seis</p>
          <p className="landing-contact-photo-tagline">
            Hamburgueria & Cervejaria
          </p>
        </div>
      </div>

      <ContactMap />
    </div>
  );
}
