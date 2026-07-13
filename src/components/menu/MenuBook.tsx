"use client";

import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLandingLocale } from "@/contexts/LandingLocaleContext";
import { usePublicMenu } from "@/hooks/usePublicMenu";
import { formatPrice } from "@/lib/menu";
import type { MenuCatalog, MenuCategory, MenuItem } from "@/lib/types";

const FOOD_IDS = new Set([
  "apetite",
  "batata-especial",
  "hamburguer",
  "acompanhamentos",
  "snacks",
  "sobremesas",
]);

const DRINK_IDS = new Set([
  "bebidas",
  "cervejas",
  "cervejas-estrangeiras",
  "vinhos",
  "sangrias",
  "gins",
]);

type CategoryGroup = { category: MenuCategory; items: MenuItem[] };

type PageSide = {
  sectionStart?: "food" | "drinks";
  groups: CategoryGroup[];
};

type ContentSpread = {
  type: "spread";
  left: PageSide;
  right: PageSide | null;
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function groupsForIds(catalog: MenuCatalog, ids: Set<string>): CategoryGroup[] {
  return catalog.categories
    .filter((c) => ids.has(c.id))
    .map((category) => ({
      category,
      items: catalog.items
        .filter((item) => item.categoryId === category.id)
        .sort((a, b) => a.name.localeCompare(b.name, "pt")),
    }))
    .filter((g) => g.items.length > 0);
}

function packPageSides(groups: CategoryGroup[], maxItems = 12): CategoryGroup[][] {
  const sides: CategoryGroup[][] = [];
  let bucket: CategoryGroup[] = [];
  let count = 0;

  for (const group of groups) {
    const size = group.items.length;
    if (count > 0 && count + size > maxItems) {
      sides.push(bucket);
      bucket = [group];
      count = size;
    } else {
      bucket.push(group);
      count += size;
    }
  }

  if (bucket.length > 0) sides.push(bucket);
  return sides;
}

function buildSectionSides(
  groups: CategoryGroup[],
  section: "food" | "drinks"
): PageSide[] {
  if (groups.length === 0) return [];

  return packPageSides(groups, 12).map((bucket, index) => ({
    sectionStart: index === 0 ? section : undefined,
    groups: bucket,
  }));
}

function buildBookSteps(catalog: MenuCatalog): ContentSpread[] {
  const sides: PageSide[] = [
    ...buildSectionSides(groupsForIds(catalog, FOOD_IDS), "food"),
    ...buildSectionSides(groupsForIds(catalog, DRINK_IDS), "drinks"),
  ];

  const spreads: ContentSpread[] = [];
  for (let i = 0; i < sides.length; i += 2) {
    spreads.push({
      type: "spread",
      left: sides[i],
      right: sides[i + 1] ?? null,
    });
  }
  return spreads;
}

function flattenSpreads(spreads: ContentSpread[]): PageSide[] {
  const pages: PageSide[] = [];
  for (const spread of spreads) {
    pages.push(spread.left);
    if (spread.right) pages.push(spread.right);
  }
  return pages;
}

function SectionBanner({ section }: { section: "food" | "drinks" }) {
  const { copy } = useLandingLocale();
  const isFood = section === "food";

  return (
    <div className="menu-book-section-banner">
      <h2 className="menu-book-section-banner-title">
        {isFood ? copy.menu.foodCover : copy.menu.drinksCover}
      </h2>
      <p className="menu-book-section-banner-sub">
        {isFood ? copy.menu.foodCoverSub : copy.menu.drinksCoverSub}
      </p>
    </div>
  );
}

function BookCategory({ category, items }: CategoryGroup) {
  return (
    <div className="menu-book-category">
      <h3 className="menu-book-category-title">{category.name}</h3>
      {category.note && (
        <p className="menu-book-category-note">{category.note}</p>
      )}
      <ul className="menu-book-list">
        {items.map((item) => {
          const desc = item.description?.trim();
          return (
            <li key={item.id} className="menu-book-item">
              <div className="menu-book-item-line">
                <span className="menu-book-item-name">{item.name}</span>
                <span className="menu-book-item-leader" aria-hidden="true" />
                <span className="menu-book-item-price">
                  {formatPrice(item.price)}
                </span>
              </div>
              {desc && <p className="menu-book-item-desc">{desc}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ContentPage({ page, side }: { page: PageSide; side: "left" | "right" }) {
  return (
    <div className={`menu-book-page menu-book-page-${side} menu-book-page-content`}>
      <div className="menu-book-page-body">
        {page.sectionStart && <SectionBanner section={page.sectionStart} />}
        {page.groups.map((group) => (
          <BookCategory key={group.category.id} {...group} />
        ))}
      </div>
    </div>
  );
}

export function MenuBook() {
  const [stepIndex, setStepIndex] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const leftPageRef = useRef<HTMLDivElement>(null);
  const rightPageRef = useRef<HTMLDivElement>(null);
  const mobilePageRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { copy } = useLandingLocale();
  const { catalog, loading, error } = usePublicMenu();

  const spreadSteps = useMemo(
    () => (catalog ? buildBookSteps(catalog) : []),
    [catalog]
  );

  const flatPages = useMemo(
    () => flattenSpreads(spreadSteps),
    [spreadSteps]
  );

  const pages = isMobile ? flatPages : spreadSteps;
  const totalPages = pages.length;

  useEffect(() => {
    if (stepIndex >= totalPages && totalPages > 0) {
      setStepIndex(totalPages - 1);
    }
  }, [stepIndex, totalPages]);

  const current = pages[stepIndex];
  const isSingleSpread =
    !isMobile &&
    current &&
    "type" in current &&
    current.type === "spread" &&
    !current.right;

  const turnPage = (direction: "next" | "prev") => {
    if (flipping) return;
    const nextIndex = direction === "next" ? stepIndex + 1 : stepIndex - 1;
    if (nextIndex < 0 || nextIndex >= totalPages) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduced) {
      setStepIndex(nextIndex);
      return;
    }

    const page = isMobile
      ? mobilePageRef.current
      : isSingleSpread
        ? leftPageRef.current
        : direction === "next"
          ? rightPageRef.current
          : leftPageRef.current;

    if (!page) {
      setStepIndex(nextIndex);
      return;
    }

    setFlipping(true);
    const origin =
      isSingleSpread || direction === "next" ? "left center" : "right center";
    const outRotate = direction === "next" ? -90 : 90;
    const inRotate = direction === "next" ? 90 : -90;

    gsap
      .timeline({ onComplete: () => setFlipping(false) })
      .to(page, {
        rotateY: outRotate,
        duration: 0.42,
        ease: "power2.in",
        transformOrigin: origin,
        zIndex: 10,
        boxShadow: "0 16px 48px rgba(0,0,0,0.28)",
      })
      .call(() => setStepIndex(nextIndex))
      .set(page, { rotateY: inRotate })
      .to(page, {
        rotateY: 0,
        duration: 0.42,
        ease: "power2.out",
        zIndex: 2,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      });
  };

  const renderSpread = (step: ContentSpread) => {
    const isSingle = !step.right;

    return (
      <>
        <div
          ref={leftPageRef}
          className="menu-book-page-shell menu-book-page-shell-left"
        >
          <ContentPage page={step.left} side="left" />
        </div>
        {step.right && (
          <div
            ref={rightPageRef}
            className="menu-book-page-shell menu-book-page-shell-right"
          >
            <ContentPage page={step.right} side="right" />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="menu-book-stage-full">
      <div className="menu-book-nav">
        <button
          type="button"
          onClick={() => turnPage("prev")}
          disabled={stepIndex === 0 || flipping}
          className="menu-book-nav-btn"
          aria-label={copy.menu.pagePrev}
        >
          ←
        </button>
        <span className="menu-book-nav-label">
          {totalPages > 0 ? `${stepIndex + 1} / ${totalPages}` : "—"}
        </span>
        <button
          type="button"
          onClick={() => turnPage("next")}
          disabled={stepIndex >= totalPages - 1 || flipping}
          className="menu-book-nav-btn"
          aria-label={copy.menu.pageNext}
        >
          →
        </button>
      </div>

      <div
        className={`menu-book menu-book-full ${flipping ? "is-flipping" : ""} ${isMobile ? "is-mobile" : ""} ${isSingleSpread ? "is-single-spread" : ""}`}
      >
        <div className="menu-book-shadow" aria-hidden="true" />
        <div className="menu-book-cover menu-book-cover-left" aria-hidden="true" />
        <div className="menu-book-spine" aria-hidden="true">
          <span />
        </div>
        <div className="menu-book-cover menu-book-cover-right" aria-hidden="true" />

        <div className="menu-book-spread menu-book-spread-3d">
          {loading ? (
            <div className="menu-book-state">{copy.menu.loading}</div>
          ) : error || !catalog || !current ? (
            <div className="menu-book-state">{copy.menu.unavailable}</div>
          ) : isMobile ? (
            <div
              ref={mobilePageRef}
              className="menu-book-page-shell menu-book-page-shell-mobile"
            >
              <ContentPage page={current as PageSide} side="right" />
            </div>
          ) : (
            renderSpread(current as ContentSpread)
          )}
        </div>
      </div>
    </div>
  );
}
