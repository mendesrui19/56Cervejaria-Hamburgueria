"use client";

import Image from "next/image";
import Link from "next/link";
import { ContactAside } from "@/components/landing/ContactAside";
import { GlovoDeliverySection } from "@/components/landing/GlovoDeliverySection";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingMobileBar } from "@/components/landing/LandingMobileBar";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingPhoneFab } from "@/components/landing/LandingPhoneFab";
import { OnlineMenuSection } from "@/components/landing/OnlineMenuSection";
import { RevealSection } from "@/components/landing/RevealSection";
import { ReviewsSection } from "@/components/landing/ReviewsSection";
import {
  LandingLocaleProvider,
  useLandingLocale,
} from "@/contexts/LandingLocaleContext";
import { BUSINESS } from "@/data/landing";
import { FOOD_PHOTOS } from "@/data/food-photos";

function LandingViewContent() {
  const { copy } = useLandingLocale();

  return (
    <main className="landing-page bg-[#f4efe6] text-[#1a1410] landing-has-mobile-bar">
      <LandingNavbar />
      <LandingPhoneFab />
      <HeroSection />

      <RevealSection id="sobre" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="landing-reveal">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a67c1a] mb-4">
              {copy.about.eyebrow}
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#1a1410] mb-6 leading-tight">
              {copy.about.titleLine1}
              <br />
              {copy.about.titleLine2}
            </h2>
            <p className="text-[#5c5248] text-base sm:text-lg leading-relaxed mb-4">
              {copy.about.p1}
            </p>
            <p className="text-[#5c5248] text-base sm:text-lg leading-relaxed">
              {copy.about.p2}
            </p>
          </div>

          <div className="relative aspect-[4/5] sm:aspect-[5/6] rounded-3xl overflow-hidden shadow-2xl landing-reveal landing-reveal-delay">
            <Image
              src="/gallery/interior-sobre.png"
              alt={copy.about.imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </RevealSection>

      <OnlineMenuSection />

      <RevealSection
        id="cervejaria"
        className="py-20 sm:py-28 bg-[#ebe4d8] border-y border-[#1a1410]/5"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl order-2 lg:order-1 landing-reveal">
            <Image
              src="/gallery/cerveja.png"
              alt={copy.brewery.imageAlt}
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="order-1 lg:order-2 landing-reveal landing-reveal-delay">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a67c1a] mb-4">
              {copy.brewery.eyebrow}
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#1a1410] mb-6 leading-tight">
              {copy.brewery.titleLine1}
              <br />
              {copy.brewery.titleLine2}
            </h2>
            <p className="text-[#5c5248] text-base sm:text-lg leading-relaxed">
              {copy.brewery.description}
            </p>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="galeria" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12 landing-reveal">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a67c1a] mb-4">
                {copy.gallery.eyebrow}
              </p>
              <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#1a1410]">
                {copy.gallery.title}
              </h2>
            </div>
            <p className="text-[#5c5248] max-w-md text-sm sm:text-base">
              {copy.gallery.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {FOOD_PHOTOS.map((photo, i) => (
              <div
                key={photo.src}
                className={`landing-gallery-card relative overflow-hidden rounded-2xl aspect-square ${
                  i === 0 || i === 4 ? "md:col-span-2 md:row-span-2 md:aspect-auto" : ""
                }`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      <GlovoDeliverySection />

      <ReviewsSection />

      <RevealSection id="contacto" className="py-20 sm:py-28 bg-[#1a1410] text-[#f4efe6]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-stretch">
            <div className="landing-reveal">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4b84a] mb-4">
                {copy.contact.eyebrow}
              </p>
              <h2 className="font-display text-3xl sm:text-5xl font-bold mb-6">
                {copy.contact.title}
              </h2>
              <p className="text-[#b8aa96] text-base sm:text-lg leading-relaxed mb-8">
                {copy.contact.subtitle}
              </p>

              <a
                href={BUSINESS.phoneHref}
                className="landing-cta-book landing-cta-book-on-dark landing-cta-book-strong inline-flex justify-center mb-8"
              >
                {copy.nav.bookNav}
              </a>

              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4b84a] mb-2">
                    {copy.contact.hours}
                  </p>
                  <ul className="space-y-1">
                    {copy.hours.map((slot) => (
                      <li
                        key={slot.days}
                        className="flex justify-between gap-4 text-sm"
                      >
                        <span className="text-[#f4efe6]">{slot.days}</span>
                        <span
                          className={
                            slot.time === copy.contact.closed
                              ? "text-[#8b7d6b]"
                              : "text-[#d4b84a]"
                          }
                        >
                          {slot.time}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4b84a] mb-2">
                    {copy.contact.address}
                  </p>
                  <p className="text-[#f4efe6]">{BUSINESS.name}</p>
                  <p className="text-[#b8aa96]">{BUSINESS.address}</p>
                  <p className="text-[#b8aa96]">{BUSINESS.city}</p>
                  <a
                    href={BUSINESS.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-xs font-bold uppercase tracking-widest text-[#d4b84a] hover:underline"
                  >
                    {copy.contact.viewMap}
                  </a>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 pt-6 border-t border-[#f4efe6]/10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4b84a] mb-1">
                    {copy.contact.phone}
                  </p>
                  <a
                    href={BUSINESS.phoneHref}
                    className="text-[#f4efe6] text-xl sm:text-2xl font-bold hover:text-[#d4b84a] transition-colors"
                  >
                    {BUSINESS.phone}
                  </a>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4b84a] mb-2">
                    {copy.contact.follow}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest">
                    <a
                      href={BUSINESS.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#b8aa96] hover:text-[#d4b84a] transition-colors"
                    >
                      Instagram
                    </a>
                    <a
                      href={BUSINESS.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#b8aa96] hover:text-[#d4b84a] transition-colors"
                    >
                      Facebook
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <ContactAside />
          </div>
        </div>
      </RevealSection>

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
            <a href="#sobre" className="hover:text-[#d4b84a] transition-colors">
              {copy.footer.about}
            </a>
            <a href="#opinioes" className="hover:text-[#d4b84a] transition-colors">
              {copy.footer.reviews}
            </a>
            <a href="#contacto" className="hover:text-[#d4b84a] transition-colors">
              {copy.footer.contact}
            </a>
            <Link href="/sistema" className="hover:text-[#d4b84a] transition-colors">
              {copy.footer.staff}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function LandingView() {
  return (
    <LandingLocaleProvider>
      <LandingViewContent />
    </LandingLocaleProvider>
  );
}
