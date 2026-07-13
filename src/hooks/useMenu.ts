"use client";

import { useCallback, useEffect, useState } from "react";
import type { MenuCatalog, MenuItem } from "@/lib/types";

export function useMenu() {
  const [catalog, setCatalog] = useState<MenuCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/menu", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao carregar menu");
      setCatalog(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const items = catalog?.items ?? [];
  const categories = catalog?.categories ?? [];
  const addons = items.filter((i) => i.isAddon);

  function getCategoryItems(categoryId: string): MenuItem[] {
    return items.filter((i) => i.categoryId === categoryId);
  }

  function getItem(id: string): MenuItem | undefined {
    return items.find((i) => i.id === id);
  }

  return {
    catalog,
    items,
    categories,
    addons,
    loading,
    error,
    refresh,
    getCategoryItems,
    getItem,
  };
}
