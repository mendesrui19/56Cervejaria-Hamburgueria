"use client";

import { useState } from "react";
import { BUSINESS, FEATURED_REVIEWS } from "@/data/landing";
import { useLandingLocale } from "@/contexts/LandingLocaleContext";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} em 5 estrelas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`text-sm ${
            i < rating ? "text-[#d4b84a]" : "text-[#1a1410]/15"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewCard({
  author,
  rating,
  text,
  when,
}: {
  author: string;
  rating: number;
  text: string;
  when?: string;
}) {
  return (
    <article className="shrink-0 w-[min(88vw,340px)] rounded-2xl border border-[#1a1410]/8 bg-white/80 p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="font-bold text-[#1a1410] truncate">{author}</p>
          {when && (
            <p className="text-[10px] text-[#8b7d6b] uppercase tracking-wide mt-0.5">
              {when}
            </p>
          )}
        </div>
        <Stars rating={rating} />
      </div>
      <p className="text-[#5c5248] text-sm leading-relaxed line-clamp-4">
        &ldquo;{text}&rdquo;
      </p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b7d6b] mt-3">
        Google
      </p>
    </article>
  );
}

export function ReviewsSection() {
  const [paused, setPaused] = useState(false);
  const { copy } = useLandingLocale();
  const track = [...FEATURED_REVIEWS, ...FEATURED_REVIEWS];

  return (
    <section id="opinioes" className="py-14 sm:py-16 bg-[#f4efe6] overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a67c1a] mb-2">
              {copy.reviews.eyebrow}
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#1a1410]">
              {copy.reviews.title}
            </h2>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-[#1a1410]/10 bg-white/60 px-4 py-3 shrink-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b7d6b]">
                Google
              </p>
              <p className="font-display text-3xl font-bold text-[#1a1410] leading-none">
                {BUSINESS.googleRatingLabel}
              </p>
            </div>
            <div>
              <Stars rating={Math.round(BUSINESS.googleRating)} />
              <p className="text-[10px] text-[#5c5248] mt-0.5">
                {copy.reviews.basedOn} {BUSINESS.googleReviewCount}{" "}
                {copy.reviews.reviews}
              </p>
            </div>
            <a
              href={BUSINESS.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold uppercase tracking-widest text-[#a67c1a] hover:underline ml-1"
            >
              Ver todas
            </a>
          </div>
        </div>

        <div
          className="reviews-marquee relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div
            className={`reviews-marquee-track flex gap-4 w-max ${paused ? "is-paused" : ""}`}
            aria-live="off"
          >
            {track.map((review, i) => (
              <ReviewCard key={`${review.author}-${i}`} {...review} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
