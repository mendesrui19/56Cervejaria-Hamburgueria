import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { appMeta, orders } from "@/db/schema";
import { getCatalogItem } from "./catalog";
import { getKitchenZone, kitchenAlertTag } from "./kitchen-zones";
import type { KitchenZone, OrderItem } from "./types";

const RESTAURANT_META_ID = "restaurant";

async function touchRestaurantUpdated(at = new Date().toISOString()) {
  const db = getDb();
  await db
    .insert(appMeta)
    .values({ id: RESTAURANT_META_ID, lastUpdated: at })
    .onConflictDoUpdate({
      target: appMeta.id,
      set: { lastUpdated: at },
    });
}

export async function setKitchenAlert(orderId: string, message: string) {
  const now = new Date().toISOString();
  const db = getDb();
  await db
    .update(orders)
    .set({
      kitchenAlert: message,
      kitchenAlertAt: now,
      updatedAt: now,
    })
    .where(eq(orders.id, orderId));
  await touchRestaurantUpdated(now);
}

export async function clearKitchenAlert(orderId: string): Promise<void> {
  const now = new Date().toISOString();
  const db = getDb();
  await db
    .update(orders)
    .set({
      kitchenAlert: null,
      kitchenAlertAt: null,
      updatedAt: now,
    })
    .where(eq(orders.id, orderId));
  await touchRestaurantUpdated(now);
}

async function resolveItemKitchenZone(
  menuItemId: string,
  categoryByMenuId: Map<string, string>
): Promise<KitchenZone> {
  const fromCatalog = categoryByMenuId.get(menuItemId);
  if (fromCatalog) {
    return getKitchenZone(fromCatalog) ?? "pratos";
  }
  const menuItem = await getCatalogItem(menuItemId);
  return getKitchenZone(menuItem?.categoryId ?? "") ?? "pratos";
}

function formatKitchenItemLabel(quantity: number, name: string): string {
  return quantity > 1 ? `${quantity}x ${name}` : name;
}

export async function setKitchenAlertForItem(
  orderId: string,
  tableNumber: number,
  item: OrderItem,
  action: "CANCELAR" | "ALTERACAO" | "NOVO",
  categoryByMenuId?: Map<string, string>
) {
  const zone = await resolveItemKitchenZone(
    item.menuItemId,
    categoryByMenuId ?? new Map()
  );
  const label = formatKitchenItemLabel(item.quantity, item.name);
  const tag = kitchenAlertTag(zone);

  let message: string;
  if (action === "NOVO") {
    message = `Mesa ${tableNumber}: ${tag} NOVO - ${label}`;
  } else if (action === "CANCELAR") {
    message = `Mesa ${tableNumber}: ${tag} CANCELAR ${label}`;
  } else {
    message = `Mesa ${tableNumber}: ${tag} ALTERACAO em ${label}. Rever pedido.`;
  }

  await setKitchenAlert(orderId, message);
}

export { resolveItemKitchenZone, formatKitchenItemLabel };
