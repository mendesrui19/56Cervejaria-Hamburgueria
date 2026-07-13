"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { waitForSiteReady } from "@/lib/site-preload";

const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const MIN_LOADER_MS = 1_400;
const FINISH_ANIM_MS = 650;
const HOLD_FULL_MS = 380;
const EXIT_MS = 560;

const PUBLIC_ROUTES = new Set(["/", "/carta"]);

function shouldShowLoader(pathname: string): boolean {
  return PUBLIC_ROUTES.has(pathname);
}

function revealSite() {
  document.documentElement.classList.remove("site-loading");
  document.documentElement.classList.add("site-ready");
  window.dispatchEvent(new CustomEvent("site-loader:done"));
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function SiteLoader() {
  const pathname = usePathname();
  const hasFinishedRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(() => shouldShowLoader(pathname));
  const [exiting, setExiting] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!shouldShowLoader(pathname)) {
      hasFinishedRef.current = true;
      setVisible(false);
      setExiting(false);
      setComplete(false);
      revealSite();
      return;
    }

    if (hasFinishedRef.current) {
      setVisible(false);
      setExiting(false);
      setComplete(false);
      revealSite();
      return;
    }

    let cancelled = false;
    let loadTarget = 6;
    let displayProgress = 0;
    let finishing = false;
    const startedAt = Date.now();

    document.documentElement.classList.add("site-loading");
    document.documentElement.classList.remove("site-ready");
    setProgress(0);
    setExiting(false);
    setComplete(false);

    const tick = () => {
      if (cancelled) return;

      if (!finishing) {
        displayProgress += (loadTarget - displayProgress) * 0.1;
        if (loadTarget - displayProgress < 0.35) {
          displayProgress = loadTarget;
        }
      }

      setProgress(Math.round(displayProgress));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const finishLoader = async () => {
      finishing = true;

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_LOADER_MS) {
        await sleep(MIN_LOADER_MS - elapsed);
      }
      if (cancelled) return;

      const finishStart = performance.now();
      await new Promise<void>((resolve) => {
        const animateToFull = (now: number) => {
          if (cancelled) {
            resolve();
            return;
          }

          const t = Math.min(1, (now - finishStart) / FINISH_ANIM_MS);
          displayProgress = 92 + 8 * easeOutCubic(t);
          setProgress(Math.round(displayProgress));

          if (t < 1) {
            requestAnimationFrame(animateToFull);
          } else {
            displayProgress = 100;
            setProgress(100);
            resolve();
          }
        };

        requestAnimationFrame(animateToFull);
      });
      if (cancelled) return;

      setComplete(true);
      await sleep(HOLD_FULL_MS);
      if (cancelled) return;

      hasFinishedRef.current = true;
      setExiting(true);
      revealSite();

      exitTimerRef.current = window.setTimeout(() => {
        if (!cancelled) setVisible(false);
      }, EXIT_MS);
    };

    waitForSiteReady(pathname, (value) => {
      if (cancelled || finishing) return;
      loadTarget = Math.min(92, Math.max(loadTarget, value));
    })
      .then(() => {
        if (cancelled) return;
        loadTarget = 92;
        void finishLoader();
      })
      .catch(() => {
        if (cancelled) return;
        hasFinishedRef.current = true;
        setVisible(false);
        setExiting(false);
        setComplete(false);
        revealSite();
      });

    return () => {
      cancelled = true;
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [pathname]);

  if (!visible) return null;

  const lineScale = Math.max(0.08, progress / 100);
  const ringOffset = RING_CIRCUMFERENCE * (1 - progress / 100);

  return (
    <div
      className={`site-loader ${complete ? "is-complete" : ""} ${
        exiting ? "is-exiting" : ""
      }`}
      role="status"
      aria-live="polite"
      aria-label={`A carregar o site, ${progress}%`}
    >
      <div className="site-loader-stage">
        <div
          className="site-loader-line site-loader-line-left"
          style={{ transform: `translateY(-50%) scaleX(${lineScale})` }}
          aria-hidden="true"
        />
        <div
          className="site-loader-line site-loader-line-right"
          style={{ transform: `translateY(-50%) scaleX(${lineScale})` }}
          aria-hidden="true"
        />

        <div className="site-loader-emblem">
          <svg
            className="site-loader-ring"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              className="site-loader-ring-track"
              cx="50"
              cy="50"
              r={RING_RADIUS}
            />
            <circle
              className="site-loader-ring-progress"
              cx="50"
              cy="50"
              r={RING_RADIUS}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
            />
          </svg>

          <Image
            src="/brand/logo.png"
            alt="Cinquenta & Seis"
            width={120}
            height={120}
            priority
            className="site-loader-logo"
          />
        </div>
      </div>

      <span className="sr-only">{progress}%</span>
    </div>
  );
}
