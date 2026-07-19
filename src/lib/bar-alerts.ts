import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { appMeta, orders } from "@/db/schema";
import type { OrderItem } from "./types";

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

export async function setBarAlert(orderId: string, message: string) {
  const now = new Date().toISOString();
  const db = getDb();
  await db
    .update(orders)
    .set({
      barAlert: message,
      barAlertAt: now,
      updatedAt: now,
    })
    .where(eq(orders.id, orderId));
  await touchRestaurantUpdated(now);
}

export async function clearBarAlert(orderId: string): Promise<void> {
  const now = new Date().toISOString();
  const db = getDb();
  await db
    .update(orders)
    .set({
      barAlert: null,
      barAlertAt: null,
      updatedAt: now,
    })
    .where(eq(orders.id, orderId));
  await touchRestaurantUpdated(now);
}

function formatBarItemLabel(quantity: number, name: string): string {
  return quantity > 1 ? `${quantity}x ${name}` : name;
}

export async function setBarAlertForItem(
  orderId: string,
  tableNumber: number,
  item: OrderItem,
  action: "CANCELAR" | "ALTERACAO" | "NOVO"
) {
  const label = formatBarItemLabel(item.quantity, item.name);

  let message: string;
  if (action === "NOVO") {
    message = `Mesa ${tableNumber}: BAR NOVO — ${label}`;
  } else if (action === "CANCELAR") {
    message = `Mesa ${tableNumber}: BAR CANCELAR ${label}`;
  } else {
    message = `Mesa ${tableNumber}: BAR ALTERAÇÃO em ${label}. Rever pedido.`;
  }

  await setBarAlert(orderId, message);
}
