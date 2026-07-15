"use client";

import "page-flip/src/Style/stPageFlip.css";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PageFlip } from "page-flip";
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

type CategoryGroup = {
  category: MenuCategory;
  items: MenuItem[];
  /** Continuação da secção na página seguinte (sem nota). */
  continued?: boolean;
};

type BookPage =
  | { kind: "cover" }
  | { kind: "section"; section: "food" | "drinks" }
  | { kind: "content"; section: "food" | "drinks"; groups: CategoryGroup[] };

/** Unidades de altura aproximadas para empacotar páginas sem espaço morto. */
const PAGE_UNITS = {
  header: 1.7,
  headerContinued: 1.35,
  note: 1.05,
  item: 1,
  itemDesc: 0.4,
} as const;

function itemUnits(item: MenuItem): number {
  return PAGE_UNITS.item + (item.description?.trim() ? PAGE_UNITS.itemDesc : 0);
}

function headerUnits(category: MenuCategory, continued = false): number {
  if (continued) return PAGE_UNITS.headerContinued;
  return PAGE_UNITS.header + (category.note?.trim() ? PAGE_UNITS.note : 0);
}

function useIsNarrow() {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return narrow;
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

/**
 * Enche cada página ao máximo.
 * - Se a secção cabe inteira → fica na página.
 * - Se não cabe → preenche o espaço restante com o que couber e continua na seguinte
 *   (só deixa espaço em branco se nem o cabeçalho + 1 item couberem).
 */
function packGroups(groups: CategoryGroup[], maxUnits: number): CategoryGroup[][] {
  const pages: CategoryGroup[][] = [];
  let bucket: CategoryGroup[] = [];
  let used = 0;

  const flush = () => {
    if (bucket.length === 0) return;
    pages.push(bucket);
    bucket = [];
    used = 0;
  };

  const takeChunk = (
    remaining: MenuItem[],
    roomForItems: number
  ): { chunk: MenuItem[]; rest: MenuItem[] } => {
    const chunk: MenuItem[] = [];
    let cost = 0;
    let i = 0;
    while (i < remaining.length) {
      const next = itemUnits(remaining[i]!);
      if (chunk.length > 0 && cost + next > roomForItems + 0.05) break;
      if (chunk.length === 0 && next > roomForItems) {
        chunk.push(remaining[i]!);
        i += 1;
        break;
      }
      chunk.push(remaining[i]!);
      cost += next;
      i += 1;
    }
    return { chunk, rest: remaining.slice(i) };
  };

  for (const group of groups) {
    let remaining = [...group.items];
    let continued = false;

    while (remaining.length > 0) {
      const head = headerUnits(group.category, continued);
      const restCost = remaining.reduce((sum, item) => sum + itemUnits(item), 0);
      const fullCost = head + restCost;

      // Cabe tudo no espaço restante
      if (used + fullCost <= maxUnits + 0.05) {
        bucket.push({
          category: group.category,
          items: remaining,
          continued,
        });
        used += fullCost;
        remaining = [];
        break;
      }

      // Não cabe o cabeçalho + pelo menos 1 item → nova página
      const minNeed = head + itemUnits(remaining[0]!);
      if (bucket.length > 0 && used + minNeed > maxUnits) {
        flush();
        continue;
      }

      // Preenche o resto da página com o que couber desta secção
      const room = Math.max(maxUnits - used - head, PAGE_UNITS.item);
      const { chunk, rest } = takeChunk(remaining, room);
      if (chunk.length === 0) {
        flush();
        continue;
      }

      bucket.push({
        category: group.category,
        items: chunk,
        continued,
      });
      used += head + chunk.reduce((sum, item) => sum + itemUnits(item), 0);
      remaining = rest;
      continued = true;

      if (remaining.length > 0) flush();
    }
  }

  flush();
  return pages;
}

function buildBookPages(catalog: MenuCatalog, maxUnits: number): BookPage[] {
  const food = groupsForIds(catalog, FOOD_IDS);
  const drinks = groupsForIds(catalog, DRINK_IDS);
  const pages: BookPage[] = [{ kind: "cover" }];

  if (food.length > 0) {
    pages.push({ kind: "section", section: "food" });
    for (const groups of packGroups(food, maxUnits)) {
      pages.push({ kind: "content", section: "food", groups });
    }
  }

  if (drinks.length > 0) {
    pages.push({ kind: "section", section: "drinks" });
    for (const groups of packGroups(drinks, maxUnits)) {
      pages.push({ kind: "content", section: "drinks", groups });
    }
  }

  return pages;
}

function ArrowIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {direction === "prev" ? (
        <path
          d="M15 5 L8 12 L15 19"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M9 5 L16 12 L9 19"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function CoverPage() {
  const { copy } = useLandingLocale();

  return (
    <div className="menu-flip-cover">
      <div className="menu-flip-cover-glow" aria-hidden="true" />
      <div className="menu-flip-cover-frame" aria-hidden="true" />
      <Image
        src="/brand/logo.png"
        alt=""
        width={140}
        height={140}
        className="menu-flip-cover-logo"
        priority
      />
      <h2 className="menu-flip-cover-title">Cinquenta &amp; Seis</h2>
      <div className="menu-flip-cover-tagline-row">
        <span className="menu-flip-cover-line" aria-hidden="true" />
        <span className="menu-flip-cover-tagline">hamburgueria &amp; cervejaria</span>
        <span className="menu-flip-cover-line" aria-hidden="true" />
      </div>
      <p className="menu-flip-cover-kicker">{copy.menu.bookPage}</p>
      <p className="menu-flip-cover-hint">{copy.menu.tapToOpen}</p>
    </div>
  );
}

function SectionPage({ section }: { section: "food" | "drinks" }) {
  const { copy } = useLandingLocale();
  const isFood = section === "food";

  return (
    <div className="menu-flip-section">
      <div className="menu-flip-section-ornament" aria-hidden="true" />
      <p className="menu-flip-section-kicker">{copy.menu.eyebrow}</p>
      <h2 className="menu-flip-section-title">
        {isFood ? copy.menu.foodCover : copy.menu.drinksCover}
      </h2>
      <span className="menu-flip-section-line" aria-hidden="true" />
      <p className="menu-flip-section-sub">
        {isFood ? copy.menu.foodCoverSub : copy.menu.drinksCoverSub}
      </p>
    </div>
  );
}

function ContentPage({
  groups,
  pageNumber,
}: {
  groups: CategoryGroup[];
  pageNumber: number;
}) {
  return (
    <div className="menu-flip-content">
      <div className="menu-flip-content-head">
        <Image
          src="/brand/logo.png"
          alt=""
          width={28}
          height={28}
          className="menu-flip-mini-logo"
        />
        <span className="menu-flip-page-num">{String(pageNumber).padStart(2, "0")}</span>
      </div>
      <div className="menu-flip-content-body">
        {groups.map((group) => (
          <div
            key={`${group.category.id}-${group.items[0]?.id}`}
            className="menu-book-category"
          >
            <h3 className="menu-book-category-title">{group.category.name}</h3>
            {group.category.note && !group.continued && (
              <p className="menu-book-category-note">{group.category.note}</p>
            )}
            <ul className="menu-book-list">
              {group.items.map((item) => {
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
        ))}
      </div>
    </div>
  );
}

function FlipPageShell({
  children,
  variant = "content",
  depth,
}: {
  children: ReactNode;
  variant?: "cover" | "section" | "content";
  depth: number;
}) {
  const isSpecial = variant === "cover" || variant === "section";
  return (
    <div
      className={`menu-flip-page ${isSpecial ? "menu-flip-page--hard" : ""}`}
      data-density="soft"
      style={{ zIndex: depth }}
    >
      <div className="menu-flip-page-inner">{children}</div>
    </div>
  );
}

export function MenuBook() {
  const bookRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const narrow = useIsNarrow();
  const { copy } = useLandingLocale();
  const { catalog, loading, error } = usePublicMenu();

  const pages = useMemo(
    () => (catalog ? buildBookPages(catalog, narrow ? 15.5 : 17.5) : []),
    [catalog, narrow]
  );

  const destroyFlip = useCallback(() => {
    const flip = flipRef.current;
    const book = bookRef.current;
    flipRef.current = null;
    if (!flip) return;

    try {
      // page-flip remove o bloco e leva as páginas consigo —
      // devolver ao contentor antes do destroy
      if (book) {
        book.querySelectorAll(".menu-flip-page").forEach((page) => {
          page.classList.remove(
            "stf__item",
            "--soft",
            "--hard",
            "--left",
            "--right",
            "--simple"
          );
          page.removeAttribute("style");
          book.appendChild(page);
        });
        book.querySelectorAll(".stf__wrapper").forEach((el) => el.remove());
        book.classList.remove("stf__parent");
        book.removeAttribute("style");
      }
      flip.destroy();
    } catch {
      /* already destroyed */
    }
  }, []);

  useEffect(() => {
    if (!catalog || pages.length === 0 || !bookRef.current) return;

    let cancelled = false;
    setReady(false);

    const boot = async () => {
      destroyFlip();
      const { PageFlip } = await import("page-flip");
      if (cancelled || !bookRef.current) return;

      const pageNodes = Array.from(
        bookRef.current.querySelectorAll<HTMLElement>(".menu-flip-page")
      );
      if (pageNodes.length === 0) return;

      const width = narrow ? 320 : 440;
      const height = narrow ? 500 : 620;

      const flip = new PageFlip(bookRef.current, {
        width,
        height,
        size: "stretch",
        minWidth: narrow ? 260 : 340,
        maxWidth: narrow ? 400 : 500,
        minHeight: narrow ? 400 : 500,
        maxHeight: narrow ? 620 : 740,
        drawShadow: true,
        flippingTime: 1000,
        usePortrait: narrow,
        startZIndex: 2,
        autoSize: true,
        maxShadowOpacity: 0.55,
        showCover: true,
        mobileScrollSupport: true,
        swipeDistance: 24,
        clickEventForward: true,
        useMouseEvents: true,
        showPageCorners: true,
        disableFlipByClick: false,
      });

      flip.loadFromHTML(pageNodes);

      const forceSoftPages = () => {
        const count = flip.getPageCount();
        for (let i = 0; i < count; i += 1) {
          flip.getPage(i)?.setDensity?.("soft");
        }
      };

      forceSoftPages();

      flip.on("flip", (e) => {
        setPageIndex(e.data);
        setFlipping(false);
      });
      flip.on("changeState", (e) => {
        const state = e.data as unknown as string;
        if (state === "flipping" || state === "user_fold") setFlipping(true);
        if (state === "read") setFlipping(false);
      });
      flip.on("changeOrientation", () => {
        flip.update();
        forceSoftPages();
      });

      if (cancelled) {
        flipRef.current = flip;
        destroyFlip();
        return;
      }

      flipRef.current = flip;
      setPageCount(flip.getPageCount());
      setPageIndex(flip.getCurrentPageIndex());
      setReady(true);
    };

    const timer = window.setTimeout(() => {
      void boot();
    }, 50);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      destroyFlip();
      setReady(false);
    };
  }, [catalog, pages, narrow, destroyFlip]);

  const canPrev = pageIndex > 0;
  const canNext = pageIndex < Math.max(pageCount - 1, 0);

  const goPrev = useCallback(() => {
    if (!canPrev || !flipRef.current || flipping) return;
    setFlipping(true);
    flipRef.current.flipPrev("bottom");
  }, [canPrev, flipping]);

  const goNext = useCallback(() => {
    if (!canNext || !flipRef.current || flipping) return;
    setFlipping(true);
    flipRef.current.flipNext("bottom");
  }, [canNext, flipping]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  // Safety: unlock if flip event misses
  useEffect(() => {
    if (!flipping) return;
    const t = window.setTimeout(() => setFlipping(false), 1000);
    return () => window.clearTimeout(t);
  }, [flipping]);

  if (loading) {
    return (
      <div className="menu-flip-stage">
        <div className="menu-flip-state">{copy.menu.loading}</div>
      </div>
    );
  }

  if (error || !catalog || pages.length === 0) {
    return (
      <div className="menu-flip-stage">
        <div className="menu-flip-state">{copy.menu.unavailable}</div>
      </div>
    );
  }

  let contentPageNumber = 0;
  const coverClosed = pageIndex === 0 && !flipping;

  return (
    <div className={`menu-flip-stage ${ready ? "is-ready" : ""}`}>
      <div
        className={`menu-flip-book-wrap ${coverClosed ? "is-cover-closed" : ""}`}
      >
        <div className="menu-flip-ambient" aria-hidden="true" />

        <button
          type="button"
          className="menu-flip-side-btn menu-flip-side-btn--prev"
          onClick={goPrev}
          disabled={!canPrev || flipping}
          aria-label={copy.menu.pagePrev}
        >
          <ArrowIcon direction="prev" />
        </button>

        <div
          ref={bookRef}
          className={`menu-flip-book ${coverClosed ? "is-cover-closed" : ""}`}
        >
          {pages.map((page, index) => {
            if (page.kind === "cover") {
              return (
                <FlipPageShell key={`cover-${index}`} variant="cover" depth={pages.length - index}>
                  <CoverPage />
                </FlipPageShell>
              );
            }
            if (page.kind === "section") {
              return (
                <FlipPageShell
                  key={`section-${page.section}-${index}`}
                  variant="section"
                  depth={pages.length - index}
                >
                  <SectionPage section={page.section} />
                </FlipPageShell>
              );
            }
            contentPageNumber += 1;
            return (
              <FlipPageShell key={`content-${index}`} variant="content" depth={pages.length - index}>
                <ContentPage groups={page.groups} pageNumber={contentPageNumber} />
              </FlipPageShell>
            );
          })}
        </div>

        <button
          type="button"
          className="menu-flip-side-btn menu-flip-side-btn--next"
          onClick={goNext}
          disabled={!canNext || flipping}
          aria-label={copy.menu.pageNext}
        >
          <ArrowIcon direction="next" />
        </button>
      </div>

      <div className="menu-flip-footer">
        <div className="menu-flip-dots" role="tablist" aria-label="Páginas">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === pageIndex}
              className={`menu-flip-dot ${i === pageIndex ? "is-active" : ""}`}
              onClick={() => {
                if (!flipRef.current || flipping) return;
                setFlipping(true);
                flipRef.current.flip(i);
              }}
              aria-label={`Página ${i + 1}`}
            />
          ))}
        </div>
        <p className="menu-flip-counter">
          {pageCount > 0 ? `${pageIndex + 1} / ${pageCount}` : "—"}
        </p>
      </div>
    </div>
  );
}
