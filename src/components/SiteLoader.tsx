"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { waitForSiteReady } from "@/lib/site-preload";

const MIN_LOADER_MS = 2_400;
const HOLD_FULL_MS = 320;
const EXIT_MS = 620;

const LOADER_VIDEO = "/video/loader.mp4";
const LOADER_POSTER = "/brand/loader-poster.jpg";

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

export function SiteLoader() {
  const pathname = usePathname();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasFinishedRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(() => shouldShowLoader(pathname));
  const [exiting, setExiting] = useState(false);
  const [preferStatic, setPreferStatic] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPreferStatic(reduce);
  }, []);

  useEffect(() => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    if (!shouldShowLoader(pathname)) {
      hasFinishedRef.current = true;
      setVisible(false);
      setExiting(false);
      revealSite();
      return;
    }

    if (hasFinishedRef.current) {
      setVisible(false);
      setExiting(false);
      revealSite();
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();

    document.documentElement.classList.add("site-loading");
    document.documentElement.classList.remove("site-ready");
    setProgress(0);
    setExiting(false);

    const video = videoRef.current;
    if (video && !preferStatic) {
      video.currentTime = 0;
      void video.play().catch(() => setPreferStatic(true));
    }

    const finishLoader = async () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_LOADER_MS) {
        await sleep(MIN_LOADER_MS - elapsed);
      }
      if (cancelled) return;

      setProgress(100);
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
      if (cancelled) return;
      setProgress(Math.min(92, value));
    })
      .then(() => {
        if (cancelled) return;
        setProgress(92);
        void finishLoader();
      })
      .catch(() => {
        if (cancelled) return;
        hasFinishedRef.current = true;
        setVisible(false);
        setExiting(false);
        revealSite();
      });

    return () => {
      cancelled = true;
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      videoRef.current?.pause();
    };
  }, [pathname, preferStatic]);

  if (!visible) return null;

  return (
    <div
      className={`site-loader ${exiting ? "is-exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`A carregar o site, ${progress}%`}
    >
      <div className="site-loader-bg" aria-hidden="true">
        <span className="site-loader-bg-base" />
        <span className="site-loader-bg-spot" />
        <span className="site-loader-bg-rim" />
        <span className="site-loader-bg-grain" />
      </div>

      <div className="site-loader-stage">
        <div className="site-loader-emblem">
          {preferStatic ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={LOADER_POSTER}
              alt="Cinquenta & Seis"
              className="site-loader-video"
            />
          ) : (
            <video
              ref={videoRef}
              className="site-loader-video"
              autoPlay
              muted
              playsInline
              loop
              preload="auto"
              poster={LOADER_POSTER}
              aria-hidden="true"
            >
              <source src={LOADER_VIDEO} type="video/mp4" />
            </video>
          )}
        </div>

        <div className="site-loader-bar" aria-hidden="true">
          <span style={{ width: `${Math.max(10, progress)}%` }} />
        </div>
      </div>

      <span className="sr-only">{progress}%</span>
    </div>
  );
}
