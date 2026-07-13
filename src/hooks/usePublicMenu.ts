"use client";

import { useEffect, useState } from "react";
import type { MenuCatalog } from "@/lib/types";

export function usePublicMenu() {
  const [catalog, setCatalog] = useState<MenuCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/public/menu");
        if (!res.ok) throw new Error("fetch failed");
        const data = (await res.json()) as MenuCatalog;
        if (!cancelled) setCatalog(data);
      } catch {
        if (!cancelled) {
          setCatalog(null);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { catalog, loading, error };
}
