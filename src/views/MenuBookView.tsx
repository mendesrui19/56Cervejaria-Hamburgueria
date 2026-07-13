"use client";

import Image from "next/image";
import Link from "next/link";
import { LandingMobileBar } from "@/components/landing/LandingMobileBar";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingPhoneFab } from "@/components/landing/LandingPhoneFab";
import { MenuBook } from "@/components/menu/MenuBook";
import {
  LandingLocaleProvider,
  useLandingLocale,
} from "@/contexts/LandingLocaleContext";

function MenuBookPageContent() {
  const { copy } = useLandingLocale();

  return (
    <main className="landing-page menu-carta-page landing-has-mobile-bar">
      <LandingNavbar />
      <LandingPhoneFab />

      <section className="menu-carta-body" aria-label={copy.menu.eyebrow}>
        <MenuBook />
      </section>

      <LandingMobileBar />

      <footer className="border-t border-[#f4efe6]/10 bg-[#14100c] text-[#8b7d6b] py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo.png"
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 object-contain opacity-80"
            />
            <p className="text-xs">{copy.footer.rights}</p>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
            <Link href="/#sobre" className="hover:text-[#d4b84a] transition-colors">
              {copy.footer.about}
            </Link>
            <Link href="/#opinioes" className="hover:text-[#d4b84a] transition-colors">
              {copy.footer.reviews}
            </Link>
            <Link href="/#contacto" className="hover:text-[#d4b84a] transition-colors">
              {copy.footer.contact}
            </Link>
            <Link href="/sistema" className="hover:text-[#d4b84a] transition-colors">
              {copy.footer.staff}
            </Link>
          </div>
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
