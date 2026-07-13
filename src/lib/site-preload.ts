import { HERO_VIDEO } from "@/data/landing";

const SHARED_ASSETS = ["/brand/logo.png"] as const;

/** Só o essencial para o primeiro ecrã — o resto carrega depois do loader */
const LANDING_ASSETS = [
  ...SHARED_ASSETS,
  HERO_VIDEO.poster,
  HERO_VIDEO.src,
] as const;

const CARTA_ASSETS = [...SHARED_ASSETS] as const;

const LOADER_MAX_MS = 9_000;

export function getPreloadAssets(pathname: string): string[] {
  if (pathname === "/" || pathname === "") {
    return [...new Set(LANDING_ASSETS)];
  }

  if (pathname === "/carta") {
    return [...CARTA_ASSETS];
  }

  return [...SHARED_ASSETS];
}

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    const finish = () => resolve();

    image.decoding = "async";
    image.onload = finish;
    image.onerror = finish;
    image.src = src;

    window.setTimeout(finish, 4_000);
  });
}

function preloadVideo(src: string): Promise<void> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const finish = () => resolve();

    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.oncanplay = finish;
    video.onerror = finish;
    video.src = src;

    window.setTimeout(finish, 8_000);
  });
}

function preloadAsset(src: string): Promise<void> {
  if (src.endsWith(".mp4")) return preloadVideo(src);
  return preloadImage(src);
}

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | void> {
  return Promise.race([
    promise,
    new Promise<void>((resolve) => window.setTimeout(resolve, ms)),
  ]);
}

export async function waitForSiteReady(
  pathname: string,
  onProgress: (value: number) => void
): Promise<void> {
  const run = async () => {
    const assets = getPreloadAssets(pathname);
    const totalSteps = assets.length + 2;
    let completed = 0;

    const report = () => {
      const value = Math.min(92, Math.round((completed / totalSteps) * 100));
      onProgress(value);
    };

    onProgress(6);

    await withTimeout(document.fonts.ready, 2_500);
    completed += 1;
    report();

    await Promise.all(
      assets.map(async (src) => {
        await preloadAsset(src);
        completed += 1;
        report();
      })
    );

    await waitForNextPaint();
    completed += 1;
    report();
  };

  await withTimeout(run(), LOADER_MAX_MS);
  onProgress(92);
}

export function getLoaderStatus(progress: number): string {
  if (progress >= 95) return "Bom apetite";
  if (progress >= 70) return "Quase na mesa";
  if (progress >= 40) return "A preparar os ingredientes";
  return "A aquecer a chapa";
}
