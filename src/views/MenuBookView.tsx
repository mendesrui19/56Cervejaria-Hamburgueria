"use client";

import Image from "next/image";
import Link from "next/link";
import { LandingMobileBar } from "@/components/landing/LandingMobileBar";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { MenuBook } from "@/components/menu/MenuBook";
import {
  LandingLocaleProvider,
  useLandingLocale,
} from "@/contexts/LandingLocaleContext";

function MenuBookPageContent() {
  const { copy } = useLandingLocale();

  return (
    <main className="landing-page menu-carta-page menu-carta-immersive landing-has-mobile-bar">
      <LandingNavbar />

      <section className="menu-carta-body" aria-label={copy.menu.eyebrow}>
        <MenuBook />
      </section>

      <LandingMobileBar />

      <footer className="menu-carta-footer">
        <div className="menu-carta-footer-inner">
          <div className="menu-carta-footer-brand">
            <Image
              src="/brand/logo.png"
              alt=""
              width={28}
              height={28}
            />
            <p>{copy.footer.rights}</p>
          </div>
          <Link href="/" className="menu-carta-footer-link">
            {copy.menu.backToSite}
          </Link>
        </div>
      </footer>
    </main>
  );
}

export default function MenuBookView() {
  return (
    <LandingLocaleProvider>
      <MenuBookPageContent />
    </LandingLocaleProvider>
  );
}
