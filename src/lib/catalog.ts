import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { assembleMenuCatalog, mapMenuItem } from "@/db/mappers";
import {
  appMeta,
  menuCategories,
  menuItems,
} from "@/db/schema";
import { MENU_CATEGORIES, MENU_ITEMS } from "./menu";
import type {
  CreateMenuItemPayload,
  MenuCatalog,
  MenuItem,
  UpdateMenuItemPayload,
} from "./types";

const CATALOG_META_ID = "menu_catalog";

function createDefaultCatalog(): MenuCatalog {
  return {
    categories: MENU_CATEGORIES,
    items: MENU_ITEMS.map((item) => ({ ...item, active: item.active ?? true })),
    updatedAt: new Date().toISOString(),
  };
}

async function touchCatalogUpdated(at = new Date().toISOString()) {
  const db = getDb();
  await db
    .insert(appMeta)
    .values({ id: CATALOG_META_ID, lastUpdated: at })
    .onConflictDoUpdate({
      target: appMeta.id,
      set: { lastUpdated: at },
    });
}

async function readCatalogMeta(): Promise<string> {
  const db = getDb();
  const [meta] = await db
    .select()
    .from(appMeta)
    .where(eq(appMeta.id, CATALOG_META_ID))
    .limit(1);

  return meta?.lastUpdated ?? new Date().toISOString();
}

async function fetchCatalogRows() {
  const db = getDb();
  const [categoryRows, itemRows] = await Promise.all([
    db.select().from(menuCategories).orderBy(asc(menuCategories.sortOrder)),
    db.select().from(menuItems).orderBy(asc(menuItems.name)),
  ]);

  return { categoryRows, itemRows };
}

function mergeSeedOptionGroups(catalog: MenuCatalog): MenuCatalog {
  const seedById = new Map(MENU_ITEMS.map((item) => [item.id, item]));

  return {
    ...catalog,
    items: catalog.items.map((item) => {
      const seed = seedById.get(item.id);
      if (!seed?.optionGroups?.length) return item;
      if (item.optionGroups?.length) return item;
      return { ...item, optionGroups: seed.optionGroups };
    }),
  };
}

export async function loadCatalog(): Promise<MenuCatalog> {
  const { categoryRows, itemRows } = await fetchCatalogRows();

  if (categoryRows.length === 0) {
    const initial = createDefaultCatalog();
    await seedCatalog(initial);
    return initial;
  }

  return mergeSeedOptionGroups(
    assembleMenuCatalog(await readCatalogMeta(), categoryRows, itemRows)
  );
}

export async function saveCatalog(catalog: MenuCatalog): Promise<void> {
  await seedCatalog(catalog);
}

export async function getCatalogItem(id: string): Promise<MenuItem | undefined> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.id, id))
    .limit(1);

  if (!row) return undefined;

  const item = mapMenuItem(row);
  const seed = MENU_ITEMS.find((entry) => entry.id === id);
  if (!item.optionGroups?.length && seed?.optionGroups?.length) {
    return { ...item, optionGroups: seed.optionGroups };
  }
  return item;
}

export async function getActiveCatalog(): Promise<MenuCatalog> {
  const catalog = await loadCatalog();
  return {
    ...catalog,
    items: catalog.items.filter((item) => item.active !== false),
  };
}

export async function updateCatalogItem(
  id: string,
  payload: UpdateMenuItemPayload
): Promise<MenuItem> {
  const db = getDb();
  const [item] = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.id, id))
    .limit(1);

  if (!item) throw new Error("Item do catálogo não encontrado");

  const updates: Partial<typeof menuItems.$inferInsert> = {};

  if (payload.name !== undefined) {
    const name = payload.name.trim();
    if (!name) throw new Error("Nome inválido");
    updates.name = name;
  }

  if (payload.price !== undefined) {
    if (!Number.isFinite(payload.price) || payload.price < 0) {
      throw new Error("Preço inválido");
    }
    updates.price = String(Math.round(payload.price * 100) / 100);
  }

  if (payload.active !== undefined) {
    updates.active = payload.active;
  }

  if (payload.categoryId !== undefined) {
    const [category] = await db
      .select({ id: menuCategories.id })
      .from(menuCategories)
      .where(eq(menuCategories.id, payload.categoryId))
      .limit(1);

    if (!category) throw new Error("Categoria inválida");
    updates.categoryId = payload.categoryId;
  }

  if (payload.skipKitchen !== undefined) {
    updates.skipKitchen = payload.skipKitchen;
  }

  if (payload.isAddon !== undefined) {
    updates.isAddon = payload.isAddon;
    updates.canBeAddon = payload.isAddon;
    if (payload.isAddon) {
      updates.categoryId = "acompanhamentos";
    }
  }

  if (payload.kitchenNotes !== undefined) {
    updates.kitchenNotes = payload.kitchenNotes.trim() || null;
  }

  const [updated] = await db
    .update(menuItems)
    .set(updates)
    .where(eq(menuItems.id, id))
    .returning();

  await touchCatalogUpdated();
  return mapMenuItem(updated);
}

export async function resetCatalogToDefaults(): Promise<MenuCatalog> {
  const initial = createDefaultCatalog();
  await seedCatalog(initial);
  return initial;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueItemId(name: string): Promise<string> {
  const db = getDb();
  const rows = await db.select({ id: menuItems.id }).from(menuItems);
  const existing = new Set(rows.map((row) => row.id));

  const base = slugify(name) || "produto";
  let id = base;
  let n = 2;
  while (existing.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

export async function createCatalogItem(
  payload: CreateMenuItemPayload
): Promise<MenuItem> {
  const name = payload.name.trim();
  if (!name) throw new Error("Nome obrigatório");

  const db = getDb();
  const [category] = await db
    .select({ id: menuCategories.id })
    .from(menuCategories)
    .where(eq(menuCategories.id, payload.categoryId))
    .limit(1);

  if (!category) throw new Error("Categoria inválida");

  if (!Number.isFinite(payload.price) || payload.price < 0) {
    throw new Error("Preço inválido");
  }

  const isAddon = payload.isAddon ?? false;
  const id = await uniqueItemId(name);

  const [created] = await db
    .insert(menuItems)
    .values({
      id,
      name,
      price: String(Math.round(payload.price * 100) / 100),
      categoryId: payload.categoryId,
      ingredients: [],
      kitchenNotes: payload.kitchenNotes,
      active: true,
      skipKitchen: payload.skipKitchen ?? false,
      isAddon,
      canBeAddon: isAddon,
    })
    .returning();

  await touchCatalogUpdated();
  return mapMenuItem(created);
}

export async function deleteCatalogItem(id: string): Promise<void> {
  const db = getDb();
  const deleted = await db
    .delete(menuItems)
    .where(eq(menuItems.id, id))
    .returning({ id: menuItems.id });

  if (deleted.length === 0) throw new Error("Item não encontrado");
  await touchCatalogUpdated();
}

export async function seedCatalog(catalog: MenuCatalog): Promise<void> {
  const db = getDb();
  const updatedAt = catalog.updatedAt || new Date().toISOString();

  await db.delete(menuItems);
  await db.delete(menuCategories);

  if (catalog.categories.length > 0) {
    await db.insert(menuCategories).values(
      catalog.categories.map((category, index) => ({
        id: category.id,
        name: category.name,
        note: category.note ?? null,
        sortOrder: index,
      }))
    );
  }

  if (catalog.items.length > 0) {
    await db.insert(menuItems).values(
      catalog.items.map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        price: String(item.price),
        description: item.description ?? null,
        ingredients: item.ingredients ?? [],
        kitchenNotes: item.kitchenNotes ?? null,
        optionGroups: item.optionGroups ?? null,
        isAddon: item.isAddon ?? false,
        canBeAddon: item.canBeAddon ?? false,
        excludesFries: item.excludesFries ?? false,
        skipKitchen: item.skipKitchen ?? false,
        active: item.active ?? true,
      }))
    );
  }

  await touchCatalogUpdated(updatedAt);
}
