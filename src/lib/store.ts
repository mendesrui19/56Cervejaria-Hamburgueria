import { asc, and, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/db/client";
import {
  assembleRestaurantState,
  mapOrder,
  mapOrderItem,
  mapTable,
} from "@/db/mappers";
import {
  appMeta,
  orderItemCustomizations,
  orderItems,
  orders,
  restaurantTables,
} from "@/db/schema";
import {
  getCatalogItem,
  loadCatalog,
} from "./catalog";
import {
  buildKitchenChoices,
  buildKitchenChoicesFromCustomizations,
  calculateItemPrice,
  isExtraCustomization,
} from "./menu";
import {
  kitchenAlertTag,
  sortKitchenItems,
} from "./kitchen-zones";
import { recordAuditLog } from "./audit-log";
import {
  formatKitchenItemLabel,
  resolveItemKitchenZone,
  setKitchenAlert,
  setKitchenAlertForItem,
} from "./kitchen-alerts";
import { setBarAlert, setBarAlertForItem } from "./bar-alerts";
import type {
  AddOrderItemPayload,
  CreateOrderPayload,
  KitchenTicketItem,
  KitchenZone,
  Order,
  OrderItem,
  OrderItemCustomization,
  OrderItemStatus,
  PaymentPayload,
  RecentPaymentEntry,
  RestaurantState,
  Table,
  TableStatus,
  UpdateOrderItemPayload,
} from "./types";
import {
  assertKitchenStatusTransition,
  assertMistoSplit,
  assertPaymentMethod,
  assertTableNumber,
  BALCAO_TABLE_NUMBER,
  MAX_TABLE_NUMBER,
  normalizeTip,
  TABLE_COUNT,
} from "./validators";
import { getServiceDayStart } from "./period";

const RESTAURANT_META_ID = "restaurant";

function customizationsKey(customizations: OrderItemCustomization[]): string {
  return JSON.stringify(
    [...customizations].sort((a, b) => a.groupId.localeCompare(b.groupId))
  );
}

function canModifyAfterKitchen(item: OrderItem): boolean {
  return item.status === "em_preparacao";
}

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

async function ensureTablesExist() {
  const db = getDb();
  const existing = await db
    .select({ number: restaurantTables.number })
    .from(restaurantTables);

  if (existing.length >= TABLE_COUNT) return;

  const existingNumbers = new Set(existing.map((row) => row.number));
  const missing = Array.from({ length: TABLE_COUNT }, (_, index) => index + 1)
    .filter((number) => !existingNumbers.has(number))
    .map((number) => ({
      number,
      status: "livre" as TableStatus,
    }));

  if (missing.length > 0) {
    await db.insert(restaurantTables).values(missing);
    await touchRestaurantUpdated();
  }
}

async function readRestaurantMeta(): Promise<string> {
  const db = getDb();
  const [meta] = await db
    .select()
    .from(appMeta)
    .where(eq(appMeta.id, RESTAURANT_META_ID))
    .limit(1);

  return meta?.lastUpdated ?? new Date().toISOString();
}

async function fetchOrderRows(orderId: string) {
  const db = getDb();
  const [orderRow] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!orderRow) return null;

  const itemRows = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
    .orderBy(asc(orderItems.createdAt));

  const itemIds = itemRows.map((row) => row.id);
  const customizationRows =
    itemIds.length === 0
      ? []
      : await db
          .select()
          .from(orderItemCustomizations)
          .where(inArray(orderItemCustomizations.orderItemId, itemIds));

  const customizationsByItem = new Map<string, OrderItemCustomization[]>();
  for (const row of customizationRows) {
    const list = customizationsByItem.get(row.orderItemId) ?? [];
    list.push({
      groupId: row.groupId,
      groupLabel: row.groupLabel,
      optionId: row.optionId,
      optionLabel: row.optionLabel,
    });
    customizationsByItem.set(row.orderItemId, list);
  }

  const items = itemRows.map((row) =>
    mapOrderItem(row, customizationsByItem.get(row.id) ?? [])
  );

  return mapOrder(orderRow, items);
}

async function getActiveOrder(tableNumber: number): Promise<Order | undefined> {
  const db = getDb();
  const [table] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, tableNumber))
    .limit(1);

  if (!table?.orderId) return undefined;

  const order = await fetchOrderRows(table.orderId);
  if (!order || order.paidAt) return undefined;
  return order;
}

async function replaceItemCustomizations(
  orderItemId: string,
  customizations: OrderItemCustomization[]
) {
  const db = getDb();
  await db
    .delete(orderItemCustomizations)
    .where(eq(orderItemCustomizations.orderItemId, orderItemId));

  if (customizations.length === 0) return;

  await db.insert(orderItemCustomizations).values(
    customizations.map((customization) => ({
      orderItemId,
      groupId: customization.groupId,
      groupLabel: customization.groupLabel,
      optionId: customization.optionId,
      optionLabel: customization.optionLabel,
    }))
  );
}

async function insertOrderItem(
  orderId: string,
  item: OrderItem
): Promise<void> {
  const db = getDb();
  await db.insert(orderItems).values({
    id: item.id,
    orderId,
    menuItemId: item.menuItemId,
    name: item.name,
    price: String(item.price),
    quantity: item.quantity,
    notes: item.notes,
    ingredients: item.ingredients,
    kitchenNotes: item.kitchenNotes ?? null,
    status: item.status,
    isAddon: item.isAddon,
    parentItemId: item.parentItemId ?? null,
    skipKitchen: item.skipKitchen ?? false,
    createdAt: item.createdAt,
    sentToKitchenAt: item.sentToKitchenAt ?? null,
    readyAt: item.readyAt ?? null,
  });

  await replaceItemCustomizations(item.id, item.customizations);
}

async function updateOrderItemRecord(item: OrderItem): Promise<void> {
  const db = getDb();
  await db
    .update(orderItems)
    .set({
      name: item.name,
      price: String(item.price),
      quantity: item.quantity,
      notes: item.notes,
      ingredients: item.ingredients,
      kitchenNotes: item.kitchenNotes ?? null,
      status: item.status,
      sentToKitchenAt: item.sentToKitchenAt ?? null,
      readyAt: item.readyAt ?? null,
    })
    .where(eq(orderItems.id, item.id));

  await replaceItemCustomizations(item.id, item.customizations);
}

export async function loadState(): Promise<RestaurantState> {
  await ensureTablesExist();

  const db = getDb();
  const [tableRows, orderRows, itemRows, customizationRows, lastUpdated] =
    await Promise.all([
      db.select().from(restaurantTables).orderBy(asc(restaurantTables.number)),
      db.select().from(orders).orderBy(asc(orders.createdAt)),
      db.select().from(orderItems).orderBy(asc(orderItems.createdAt)),
      db.select().from(orderItemCustomizations),
      readRestaurantMeta(),
    ]);

  return assembleRestaurantState(
    lastUpdated,
    tableRows,
    orderRows,
    itemRows,
    customizationRows
  );
}

export async function saveState(state: RestaurantState): Promise<void> {
  const db = getDb();
  const updatedAt = state.lastUpdated || new Date().toISOString();

  await db.delete(orderItemCustomizations);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(restaurantTables);

  if (state.tables.length > 0) {
    await db.insert(restaurantTables).values(
      state.tables.map((table) => ({
        number: table.number,
        status: table.status,
        orderId: table.orderId ?? null,
        guestCount: table.guestCount ?? null,
        openedAt: table.openedAt ?? null,
      }))
    );
  }

  for (const order of state.orders) {
    await db.insert(orders).values({
      id: order.id,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      closedAt: order.closedAt ?? null,
      paidAt: order.paidAt ?? null,
      paymentMethod: order.paymentMethod ?? null,
      tip:
        order.tip === undefined || order.tip === null
          ? null
          : String(order.tip),
      paymentCash:
        order.paymentCash === undefined || order.paymentCash === null
          ? null
          : String(order.paymentCash),
      paymentCard:
        order.paymentCard === undefined || order.paymentCard === null
          ? null
          : String(order.paymentCard),
      kitchenAlert: order.kitchenAlert ?? null,
      kitchenAlertAt: order.kitchenAlertAt ?? null,
      barAlert: order.barAlert ?? null,
      barAlertAt: order.barAlertAt ?? null,
    });

    for (const item of order.items) {
      await insertOrderItem(order.id, item);
    }
  }

  await touchRestaurantUpdated(updatedAt);
}

export async function getState(): Promise<RestaurantState> {
  const state = await loadState();
  return {
    ...state,
    orders: state.orders.filter((order) => !order.paidAt),
  };
}

/** Cria a próxima mesa de sala livre (não balcão). */
export async function addDiningTable(actorName?: string): Promise<Table> {
  await ensureTablesExist();
  const db = getDb();
  const existing = await db
    .select({ number: restaurantTables.number })
    .from(restaurantTables);
  const used = new Set(existing.map((row) => row.number));

  let next = 1;
  while (
    next <= MAX_TABLE_NUMBER &&
    (next === BALCAO_TABLE_NUMBER || used.has(next))
  ) {
    next += 1;
  }

  if (next > MAX_TABLE_NUMBER) {
    throw new Error(`Limite de mesas atingido (${MAX_TABLE_NUMBER})`);
  }

  const [created] = await db
    .insert(restaurantTables)
    .values({ number: next, status: "livre" })
    .returning();

  if (!created) throw new Error("Não foi possível criar a mesa");

  await recordAuditLog({
    action: "add_table",
    actor: actorName?.trim() || "Staff",
    tableNumber: next,
    detail: `Mesa ${next} adicionada`,
  });
  await touchRestaurantUpdated();
  return mapTable(created);
}

export async function openTable(
  tableNumber: number,
  waiterName: string,
  guestCount?: number
): Promise<{ table: Table; order: Order }> {
  assertTableNumber(tableNumber);
  const trimmedName = waiterName.trim();
  if (!trimmedName) throw new Error("Nome do empregado obrigatório");

  await ensureTablesExist();

  const existing = await getActiveOrder(tableNumber);
  if (existing) {
    const db = getDb();
    const [table] = await db
      .select()
      .from(restaurantTables)
      .where(eq(restaurantTables.number, tableNumber))
      .limit(1);

    if (!table) throw new Error("Mesa não encontrada");
    return { table: mapTable(table), order: existing };
  }

  const db = getDb();
  const [table] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, tableNumber))
    .limit(1);

  if (!table) throw new Error("Mesa não encontrada");
  if (table.status !== "livre" || table.orderId) {
    throw new Error("Mesa não está livre");
  }

  const now = new Date().toISOString();
  const order: Order = {
    id: uuidv4(),
    tableNumber,
    items: [],
    waiterName: trimmedName,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(orders).values({
    id: order.id,
    tableNumber,
    waiterName: trimmedName,
    createdAt: now,
    updatedAt: now,
  });

  const [updatedTable] = await db
    .update(restaurantTables)
    .set({
      status: "ocupada",
      orderId: order.id,
      guestCount: guestCount ?? null,
      openedAt: now,
    })
    .where(
      and(
        eq(restaurantTables.number, tableNumber),
        eq(restaurantTables.status, "livre"),
        isNull(restaurantTables.orderId)
      )
    )
    .returning();

  if (!updatedTable) {
    throw new Error("Mesa já foi aberta por outro empregado");
  }

  await touchRestaurantUpdated(now);
  return { table: mapTable(updatedTable), order };
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { order } = await openTable(
    payload.tableNumber,
    payload.waiterName,
    payload.guestCount
  );
  return order;
}

export async function addItemToOrder(
  tableNumber: number,
  payload: AddOrderItemPayload
): Promise<Order> {
  assertTableNumber(tableNumber);

  const db = getDb();
  const [tableRow] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, tableNumber))
    .limit(1);

  let order = await getActiveOrder(tableNumber);
  if (!order) {
    throw new Error("Mesa sem pedido ativo. Abra a mesa primeiro.");
  }

  const menuItem = await getCatalogItem(payload.menuItemId);
  if (!menuItem || menuItem.active === false) {
    throw new Error("Item do menu não encontrado");
  }

  if (tableRow?.status === "a_pagar" && !menuItem.skipKitchen) {
    throw new Error(
      "Conta pedida — só bebidas. Usa «Nova ronda» para voltar a pedir comida."
    );
  }

  const catalog = await loadCatalog();
  const resolveItem = (id: string) => catalog.items.find((i) => i.id === id);

  if (menuItem.isAddon && !payload.parentItemId) {
    const parent = [...order.items]
      .reverse()
      .find(
        (item) =>
          !item.isAddon &&
          (item.status === "pendente" || item.status === "em_preparacao")
      );

    if (!parent) {
      throw new Error(
        "Adicione primeiro um prato (hambúrguer, etc.) antes do extra."
      );
    }

    const parentMenu = await getCatalogItem(parent.menuItemId);
    if (!parentMenu) throw new Error("Prato principal não encontrado");

    const already = parent.customizations.some(
      (customization) =>
        isExtraCustomization(customization.groupId) &&
        customization.optionId === menuItem.id
    );
    if (already) {
      throw new Error(`${menuItem.name} já está neste prato.`);
    }

    parent.customizations.push({
      groupId: `extra-${menuItem.id}`,
      groupLabel: "Extra",
      optionId: menuItem.id,
      optionLabel: menuItem.name,
    });
    parent.price = calculateItemPrice(
      parentMenu,
      parent.customizations,
      resolveItem
    );
    parent.ingredients = buildKitchenChoices(
      parentMenu,
      parent.customizations
    );

    await updateOrderItemRecord(parent);
    const now = new Date().toISOString();
    await db
      .update(orders)
      .set({ updatedAt: now })
      .where(eq(orders.id, order.id));
    await touchRestaurantUpdated(now);

    order = (await fetchOrderRows(order.id))!;
    return order;
  }

  if (menuItem.optionGroups) {
    for (const group of menuItem.optionGroups) {
      if (group.required) {
        const hasSelection = payload.customizations.some(
          (customization) => customization.groupId === group.id
        );
        if (!hasSelection) {
          throw new Error(`Seleção obrigatória: ${group.label}`);
        }
      }
    }
  }

  const ingredients = buildKitchenChoices(
    menuItem,
    payload.customizations
  ).filter((line) => !/^como servir:\s*só a bebida$/i.test(line));

  const quantity = Math.max(1, Math.min(20, payload.quantity || 1));

  if (!menuItem.isAddon && !payload.parentItemId) {
    const existingLine = order.items.find(
      (item) =>
        !item.isAddon &&
        item.menuItemId === menuItem.id &&
        item.notes === payload.notes &&
        customizationsKey(item.customizations) ===
          customizationsKey(payload.customizations) &&
        item.status === "pendente"
    );

    if (existingLine) {
      existingLine.quantity += quantity;
      await updateOrderItemRecord(existingLine);
      const now = new Date().toISOString();
      await db
        .update(orders)
        .set({ updatedAt: now })
        .where(eq(orders.id, order.id));
      await touchRestaurantUpdated(now);
      return (await fetchOrderRows(order.id))!;
    }
  }

  const isDrink = Boolean(menuItem.skipKitchen);
  const nowIso = new Date().toISOString();
  const orderItem: OrderItem = {
    id: uuidv4(),
    menuItemId: menuItem.id,
    name: menuItem.name,
    price: calculateItemPrice(menuItem, payload.customizations, resolveItem),
    quantity,
    customizations: payload.customizations,
    notes: payload.notes,
    ingredients,
    kitchenNotes: isDrink ? undefined : menuItem.kitchenNotes,
    // Comida e bebidas ficam pendentes até o empregado enviar
    status: "pendente",
    sentToKitchenAt: undefined,
    isAddon: menuItem.isAddon ?? false,
    skipKitchen: isDrink,
    parentItemId: payload.parentItemId,
    createdAt: nowIso,
  };

  await insertOrderItem(order.id, orderItem);

  const now = new Date().toISOString();
  await db
    .update(orders)
    .set({ updatedAt: now })
    .where(eq(orders.id, order.id));

  // Bebidas com conta pedida: manter a_pagar para a caixa não perder o pedido
  const nextTableStatus =
    tableRow?.status === "a_pagar" && menuItem.skipKitchen
      ? "a_pagar"
      : "ocupada";

  await db
    .update(restaurantTables)
    .set({ status: nextTableStatus })
    .where(eq(restaurantTables.number, tableNumber));
  await touchRestaurantUpdated(now);

  order = (await fetchOrderRows(order.id))!;
  return order;
}

export async function sendItemsToKitchen(
  tableNumber: number,
  itemIds?: string[]
): Promise<Order> {
  const order = await getActiveOrder(tableNumber);
  if (!order) throw new Error("Pedido não encontrado");

  const now = new Date().toISOString();
  const catalog = await loadCatalog();
  const categoryByMenuId = new Map(
    catalog.items.map((item) => [item.id, item.categoryId])
  );

  const hadKitchenActivity = order.items.some(
    (item) =>
      !item.isAddon &&
      !item.skipKitchen &&
      item.status !== "cancelado" &&
      item.status !== "pendente"
  );
  const hadBarActivity = order.items.some(
    (item) =>
      !item.isAddon &&
      item.skipKitchen &&
      item.status !== "cancelado" &&
      item.status !== "pendente"
  );

  const newlySent: OrderItem[] = [];

  for (const item of order.items) {
    if (item.status !== "pendente") continue;
    if (itemIds && !itemIds.includes(item.id)) continue;

    item.ingredients = await resolveKitchenChoices(item);
    item.status = "em_preparacao";
    item.sentToKitchenAt = now;
    await updateOrderItemRecord(item);
    newlySent.push(item);
  }

  const db = getDb();
  await db
    .update(orders)
    .set({ updatedAt: now })
    .where(eq(orders.id, order.id));
  await touchRestaurantUpdated(now);

  const newlySentFood = newlySent.filter((item) => !item.skipKitchen);
  const newlySentDrinks = newlySent.filter((item) => item.skipKitchen);

  if (hadKitchenActivity && newlySentFood.length > 0) {
    if (newlySentFood.length === 1) {
      await setKitchenAlertForItem(
        order.id,
        tableNumber,
        newlySentFood[0]!,
        "NOVO",
        categoryByMenuId
      );
    } else {
      const byZone = new Map<KitchenZone, string[]>();
      for (const item of newlySentFood) {
        const zone = await resolveItemKitchenZone(
          item.menuItemId,
          categoryByMenuId
        );
        const list = byZone.get(zone) ?? [];
        list.push(formatKitchenItemLabel(item.quantity, item.name));
        byZone.set(zone, list);
      }
      const parts: string[] = [];
      for (const zone of ["entradas", "pratos"] as const) {
        const labels = byZone.get(zone);
        if (labels?.length) {
          parts.push(`${kitchenAlertTag(zone)} ${labels.join(", ")}`);
        }
      }
      await setKitchenAlert(
        order.id,
        `Mesa ${tableNumber}: NOVO — ${parts.join(" · ")}`
      );
    }
  }

  if (hadBarActivity && newlySentDrinks.length > 0) {
    if (newlySentDrinks.length === 1) {
      await setBarAlertForItem(
        order.id,
        tableNumber,
        newlySentDrinks[0]!,
        "NOVO"
      );
    } else {
      const labels = newlySentDrinks.map((item) =>
        formatKitchenItemLabel(item.quantity, item.name)
      );
      await setBarAlert(
        order.id,
        `Mesa ${tableNumber}: BAR NOVO — ${labels.join(", ")}`
      );
    }
  }

  return (await fetchOrderRows(order.id))!;
}

export async function updateItemStatus(
  itemId: string,
  status: OrderItemStatus
): Promise<OrderItem> {
  const db = getDb();
  const [itemRow] = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.id, itemId))
    .limit(1);

  if (!itemRow) throw new Error("Item não encontrado");

  const orderBefore = await fetchOrderRows(itemRow.orderId);
  if (!orderBefore) throw new Error("Pedido não encontrado");
  if (orderBefore.paidAt) throw new Error("Pedido já foi pago");

  assertKitchenStatusTransition(itemRow.status as OrderItemStatus, status, {
    bar: Boolean(itemRow.skipKitchen),
  });

  const now = new Date().toISOString();
  const readyAt =
    status === "pronto"
      ? now
      : status === "em_preparacao"
      ? null
      : itemRow.readyAt;

  const sentToKitchenAt =
    itemRow.skipKitchen &&
    !itemRow.sentToKitchenAt &&
    (status === "em_preparacao" || status === "pronto")
      ? now
      : itemRow.sentToKitchenAt;

  await db
    .update(orderItems)
    .set({
      status,
      readyAt: readyAt ?? null,
      sentToKitchenAt: sentToKitchenAt ?? null,
    })
    .where(eq(orderItems.id, itemId));

  await db
    .update(orders)
    .set({ updatedAt: now })
    .where(eq(orders.id, itemRow.orderId));

  const order = await fetchOrderRows(itemRow.orderId);
  if (!order) throw new Error("Pedido não encontrado");

  // Não passar a mesa a «a_pagar» automaticamente — só com Pedir conta.

  await touchRestaurantUpdated(now);

  const updatedItem = order.items.find((item) => item.id === itemId);
  if (!updatedItem) throw new Error("Item não encontrado");
  return updatedItem;
}

export async function removeOrderItem(
  tableNumber: number,
  itemId: string
): Promise<Order> {
  const order = await getActiveOrder(tableNumber);
  if (!order) throw new Error("Pedido não encontrado");

  const item = order.items.find((entry) => entry.id === itemId);
  if (!item) throw new Error("Item não encontrado");
  if (item.status !== "pendente") {
    throw new Error(
      "Só é possível remover itens ainda não enviados (cozinha/bar)"
    );
  }

  const db = getDb();
  const childIds = order.items
    .filter((entry) => entry.parentItemId === itemId)
    .map((entry) => entry.id);
  const idsToDelete = [itemId, ...childIds];

  await db.delete(orderItems).where(inArray(orderItems.id, idsToDelete));

  const now = new Date().toISOString();
  await db
    .update(orders)
    .set({ updatedAt: now })
    .where(eq(orders.id, order.id));
  await touchRestaurantUpdated(now);

  await recordAuditLog({
    action: "item_remove",
    actor: order.waiterName,
    tableNumber,
    orderId: order.id,
    detail: `Removido ${item.quantity}× ${item.name} (mesa ${tableNumber})`,
  });

  return (await fetchOrderRows(order.id))!;
}

export async function updateTableGuestCount(
  tableNumber: number,
  guestCount: number
): Promise<Table> {
  assertTableNumber(tableNumber);
  const count = Math.max(1, Math.min(20, Math.floor(guestCount)));

  const db = getDb();
  const [tableRow] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, tableNumber))
    .limit(1);

  if (!tableRow) throw new Error("Mesa não encontrada");
  if (!tableRow.orderId) throw new Error("Mesa sem pedido activo");

  const order = await fetchOrderRows(tableRow.orderId);
  if (!order) throw new Error("Pedido não encontrado");

  const previous = tableRow.guestCount ?? 0;

  const [updated] = await db
    .update(restaurantTables)
    .set({ guestCount: count })
    .where(eq(restaurantTables.number, tableNumber))
    .returning();

  await touchRestaurantUpdated(new Date().toISOString());

  if (previous !== count) {
    await recordAuditLog({
      action: "guest_count_update",
      actor: order.waiterName,
      tableNumber,
      orderId: order.id,
      detail: `Pessoas na mesa ${tableNumber}: ${previous || "?"} → ${count}`,
    });
  }

  return mapTable(updated!);
}

export async function requestBill(tableNumber: number): Promise<Table> {
  assertTableNumber(tableNumber);
  const db = getDb();

  const [table] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, tableNumber))
    .limit(1);

  if (!table) throw new Error("Mesa não encontrada");
  if (table.status === "livre" || !table.orderId) {
    throw new Error("Mesa sem pedido activo");
  }
  if (table.status === "a_pagar") {
    return mapTable(table);
  }

  const [updatedTable] = await db
    .update(restaurantTables)
    .set({ status: "a_pagar" })
    .where(eq(restaurantTables.number, tableNumber))
    .returning();

  if (!updatedTable) throw new Error("Mesa não encontrada");

  const now = new Date().toISOString();
  await recordAuditLog({
    action: "request_bill",
    tableNumber,
    orderId: table.orderId,
    detail: `Conta pedida — mesa ${tableNumber}`,
  });
  await touchRestaurantUpdated(now);
  return mapTable(updatedTable);
}

/** Volta a mesa de «a pagar» para «ocupada» — nova ronda de comida/serviço. */
export async function reopenTableRound(
  tableNumber: number,
  actor?: string
): Promise<Table> {
  assertTableNumber(tableNumber);
  const db = getDb();

  const [table] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, tableNumber))
    .limit(1);

  if (!table) throw new Error("Mesa não encontrada");
  if (table.status === "livre" || !table.orderId) {
    throw new Error("Mesa sem pedido activo");
  }
  if (table.status !== "a_pagar") {
    return mapTable(table);
  }

  const [updatedTable] = await db
    .update(restaurantTables)
    .set({ status: "ocupada" })
    .where(eq(restaurantTables.number, tableNumber))
    .returning();

  if (!updatedTable) throw new Error("Mesa não encontrada");

  const now = new Date().toISOString();
  await recordAuditLog({
    action: "reopen_round",
    actor: actor?.trim() || "Staff",
    tableNumber,
    orderId: table.orderId,
    detail: `Nova ronda — mesa ${tableNumber} voltou a ocupada`,
  });
  await touchRestaurantUpdated(now);
  return mapTable(updatedTable);
}

export async function clearTable(
  tableNumber: number,
  actor?: string
): Promise<Table> {
  assertTableNumber(tableNumber);
  const db = getDb();

  const [table] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, tableNumber))
    .limit(1);

  if (!table) throw new Error("Mesa não encontrada");
  if (table.status === "livre" && !table.orderId) {
    return mapTable(table);
  }
  if (!table.orderId) {
    const [freed] = await db
      .update(restaurantTables)
      .set({
        status: "livre",
        orderId: null,
        guestCount: null,
        openedAt: null,
      })
      .where(eq(restaurantTables.number, tableNumber))
      .returning();
    await touchRestaurantUpdated(new Date().toISOString());
    return mapTable(freed!);
  }

  const order = await fetchOrderRows(table.orderId);
  if (!order) throw new Error("Pedido não encontrado");
  if (order.paidAt) throw new Error("Pedido já pago");

  const activeItems = order.items.filter(
    (item) => item.status !== "cancelado" && !item.isAddon
  );
  const blocked = activeItems.filter(
    (item) =>
      !item.skipKitchen &&
      (item.status === "pronto" || item.status === "entregue")
  );
  if (blocked.length > 0) {
    throw new Error(
      "Há pratos prontos ou entregues. Cancela na cozinha ou paga a conta."
    );
  }

  const now = new Date().toISOString();

  for (const item of activeItems) {
    if (item.status === "pendente") {
      await db.delete(orderItems).where(eq(orderItems.id, item.id));
      continue;
    }

    // Já enviados: cancelar (comida gera alerta na cozinha)
    await db
      .update(orderItems)
      .set({ status: "cancelado" })
      .where(eq(orderItems.id, item.id));

    if (!item.isAddon) {
      if (item.skipKitchen) {
        await setBarAlertForItem(order.id, tableNumber, item, "CANCELAR");
      } else {
        await setKitchenAlertForItem(order.id, tableNumber, item, "CANCELAR");
      }
    }
  }

  // limpar addons órfãos
  await db.delete(orderItems).where(
    and(eq(orderItems.orderId, order.id), eq(orderItems.isAddon, true))
  );

  await db
    .update(orders)
    .set({
      closedAt: now,
      updatedAt: now,
      kitchenAlert: null,
      kitchenAlertAt: null,
      barAlert: null,
      barAlertAt: null,
    })
    .where(eq(orders.id, order.id));

  const [freed] = await db
    .update(restaurantTables)
    .set({
      status: "livre",
      orderId: null,
      guestCount: null,
      openedAt: null,
    })
    .where(eq(restaurantTables.number, tableNumber))
    .returning();

  await recordAuditLog({
    action: "clear_table",
    actor: actor || order.waiterName,
    tableNumber,
    orderId: order.id,
    detail: `Mesa ${tableNumber} fechada sem pagamento (erro / vazia)`,
  });

  await touchRestaurantUpdated(now);
  return mapTable(freed!);
}

export async function processPayment(
  tableNumber: number,
  payload: PaymentPayload
): Promise<{ table: Table; order: Order; total: number }> {
  assertTableNumber(tableNumber);
  const paymentMethod = assertPaymentMethod(payload.paymentMethod);
  const tip = normalizeTip(payload.tip);

  const db = getDb();
  const [table] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, tableNumber))
    .limit(1);

  if (!table?.orderId) throw new Error("Pedido não encontrado");

  const order = await fetchOrderRows(table.orderId);
  if (!order) throw new Error("Pedido não encontrado");
  if (order.paidAt) throw new Error("Este pedido já foi pago");

  const subtotal = order.items
    .filter((item) => item.status !== "cancelado" && !item.isAddon)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const loyaltyDiscount = Math.max(
    0,
    Math.min(
      subtotal,
      Math.round((Number(payload.loyaltyDiscount) || 0) * 100) / 100
    )
  );

  if (loyaltyDiscount > 0) {
    if (!payload.loyaltyMemberId || !payload.loyaltyRewardId) {
      throw new Error("Recompensa App 56 incompleta");
    }
  }

  const now = new Date().toISOString();
  const total = Math.round((subtotal - loyaltyDiscount + tip) * 100) / 100;

  let paymentCash: string | null = null;
  let paymentCard: string | null = null;
  if (paymentMethod === "misto") {
    const split = assertMistoSplit(
      total,
      payload.paymentCash,
      payload.paymentCard
    );
    paymentCash = String(split.cash);
    paymentCard = String(split.card);
  }

  const [paidOrder] = await db
    .update(orders)
    .set({
      paidAt: now,
      paymentMethod,
      tip: String(tip),
      paymentCash,
      paymentCard,
      closedAt: now,
      updatedAt: now,
    })
    .where(and(eq(orders.id, order.id), isNull(orders.paidAt)))
    .returning();

  if (!paidOrder) throw new Error("Este pedido já foi pago");

  // Não alterar estados dos itens — ficam como estavam (pendente/preparar/pronto…).
  // Assim, se anular o pagamento, o pedido reabre com a verdade do serviço.

  const [updatedTable] = await db
    .update(restaurantTables)
    .set({
      status: "livre",
      orderId: null,
      guestCount: null,
      openedAt: null,
    })
    .where(eq(restaurantTables.number, tableNumber))
    .returning();

  await touchRestaurantUpdated(now);

  if (
    loyaltyDiscount > 0 &&
    payload.loyaltyMemberId &&
    payload.loyaltyRewardId
  ) {
    const { redeemLoyaltyReward } = await import("./loyalty-store");
    await redeemLoyaltyReward(
      payload.loyaltyMemberId,
      payload.loyaltyRewardId
    );
    await recordAuditLog({
      action: "loyalty_redeem",
      actor: order.waiterName,
      tableNumber,
      orderId: order.id,
      detail: `Recompensa #${payload.loyaltyRewardId} (−${loyaltyDiscount.toFixed(2)}€) na mesa ${tableNumber}`,
    });
  }

  const finalOrder = (await fetchOrderRows(order.id))!;
  return {
    table: mapTable(updatedTable),
    order: finalOrder,
    total,
  };
}

export async function getRecentPayments(
  limit = 8
): Promise<RecentPaymentEntry[]> {
  const db = getDb();
  const since = getServiceDayStart().toISOString();

  const rows = await db
    .select()
    .from(orders)
    .where(isNotNull(orders.paidAt))
    .orderBy(desc(orders.paidAt))
    .limit(limit * 3);

  const results: RecentPaymentEntry[] = [];

  for (const row of rows) {
    if (!row.paidAt || row.paidAt < since) continue;

    const order = await fetchOrderRows(row.id);
    if (!order?.paidAt) continue;

    const subtotal = order.items
      .filter((item) => item.status !== "cancelado" && !item.isAddon)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tip = order.tip ?? 0;

    results.push({
      orderId: order.id,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      paidAt: order.paidAt,
      total: subtotal + tip,
      paymentMethod: order.paymentMethod,
      paymentCash: order.paymentCash,
      paymentCard: order.paymentCard,
      tip,
    });

    if (results.length >= limit) break;
  }

  return results;
}

export async function voidPayment(orderId: string): Promise<Order> {
  const db = getDb();
  const order = await fetchOrderRows(orderId);
  if (!order) throw new Error("Pedido não encontrado");
  if (!order.paidAt) throw new Error("Este pedido ainda não foi pago");

  const [table] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, order.tableNumber))
    .limit(1);

  if (!table) throw new Error("Mesa não encontrada");
  if (table.orderId) {
    throw new Error("Mesa já tem um pedido novo — não é possível anular");
  }

  const now = new Date().toISOString();

  await db
    .update(orders)
    .set({
      paidAt: null,
      closedAt: null,
      paymentMethod: null,
      tip: null,
      paymentCash: null,
      paymentCard: null,
      updatedAt: now,
    })
    .where(eq(orders.id, order.id));

  // Itens mantêm o estado real (não se inventa pronto/bar).
  // Mesa volta a a_pagar — tinham ido cobrar.
  await db
    .update(restaurantTables)
    .set({
      status: "a_pagar",
      orderId: order.id,
      openedAt: table.openedAt ?? order.createdAt ?? now,
    })
    .where(eq(restaurantTables.number, order.tableNumber));

  await touchRestaurantUpdated(now);

  await recordAuditLog({
    action: "void_payment",
    actor: order.waiterName,
    tableNumber: order.tableNumber,
    orderId: order.id,
    detail: `Pagamento anulado — mesa ${order.tableNumber}`,
  });

  return (await fetchOrderRows(order.id))!;
}

async function resolveKitchenChoices(item: OrderItem): Promise<string[]> {
  const menuItem = await getCatalogItem(item.menuItemId);
  const choices = menuItem
    ? buildKitchenChoices(menuItem, item.customizations)
    : buildKitchenChoicesFromCustomizations(item.customizations);

  // Opção por defeito das refrigerantes — não poluir o ticket do bar
  return choices.filter(
    (line) => !/^como servir:\s*só a bebida$/i.test(line)
  );
}

function toKitchenTicketItem(
  item: OrderItem,
  choices: string[],
  kitchenZone?: KitchenZone | null
): KitchenTicketItem {
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    notes: item.notes,
    status: item.status,
    sentToKitchenAt: item.sentToKitchenAt,
    readyAt: item.readyAt,
    choices,
    kitchenNotes: item.kitchenNotes,
    kitchenZone: kitchenZone ?? undefined,
  };
}

export async function getKitchenOrders(): Promise<
  Array<{
    orderId: string;
    tableNumber: number;
    waiterName: string;
    items: KitchenTicketItem[];
    createdAt: string;
    kitchenAlert?: string;
    kitchenAlertAt?: string;
  }>
> {
  const db = getDb();
  const activeOrders = await db
    .select()
    .from(orders)
    .where(isNull(orders.paidAt))
    .orderBy(asc(orders.createdAt));

  const results: Array<{
    orderId: string;
    tableNumber: number;
    waiterName: string;
    items: KitchenTicketItem[];
    createdAt: string;
    kitchenAlert?: string;
    kitchenAlertAt?: string;
  }> = [];

  const catalog = await loadCatalog();
  const categoryByMenuId = new Map(
    catalog.items.map((item) => [item.id, item.categoryId])
  );

  for (const orderRow of activeOrders) {
    const order = await fetchOrderRows(orderRow.id);
    if (!order) continue;

    const visibleItems = order.items.filter(
      (item) =>
        !item.isAddon &&
        !item.skipKitchen &&
        item.status !== "cancelado" &&
        (item.status === "em_preparacao" ||
          item.status === "pronto" ||
          (item.status === "pendente" && item.sentToKitchenAt))
    );

    if (visibleItems.length === 0 && !order.kitchenAlert) continue;

    const items =
      visibleItems.length === 0
        ? []
        : sortKitchenItems(
            await Promise.all(
              visibleItems.map(async (item) => {
                const choices =
                  item.ingredients.length > 0
                    ? item.ingredients
                    : await resolveKitchenChoices(item);
                const zone = await resolveItemKitchenZone(
                  item.menuItemId,
                  categoryByMenuId
                );
                return toKitchenTicketItem(item, choices, zone);
              })
            )
          );

    results.push({
      orderId: order.id,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      items,
      createdAt: order.createdAt,
      kitchenAlert: order.kitchenAlert,
      kitchenAlertAt: order.kitchenAlertAt,
    });
  }

  return results.sort(
    (a, b) =>
      new Date(a.items[0]?.sentToKitchenAt ?? a.createdAt).getTime() -
      new Date(b.items[0]?.sentToKitchenAt ?? b.createdAt).getTime()
  );
}

/** Fila de bebidas para a caixa (bar) — espelho da cozinha só com skipKitchen. */
export async function getBarOrders(): Promise<
  Array<{
    orderId: string;
    tableNumber: number;
    waiterName: string;
    items: KitchenTicketItem[];
    createdAt: string;
    barAlert?: string;
    barAlertAt?: string;
  }>
> {
  const db = getDb();
  const activeOrders = await db
    .select()
    .from(orders)
    .where(isNull(orders.paidAt))
    .orderBy(asc(orders.createdAt));

  const results: Array<{
    orderId: string;
    tableNumber: number;
    waiterName: string;
    items: KitchenTicketItem[];
    createdAt: string;
    barAlert?: string;
    barAlertAt?: string;
  }> = [];

  for (const orderRow of activeOrders) {
    const order = await fetchOrderRows(orderRow.id);
    if (!order) continue;

    const visibleItems = order.items.filter(
      (item) =>
        item.skipKitchen &&
        !item.isAddon &&
        (item.status === "em_preparacao" || item.status === "pronto")
    );

    if (visibleItems.length === 0 && !order.barAlert) continue;

    const items = await Promise.all(
      visibleItems.map(async (item) => {
        const choices =
          item.ingredients.length > 0
            ? item.ingredients
            : await resolveKitchenChoices(item);
        return toKitchenTicketItem(item, choices, null);
      })
    );

    items.sort((a, b) => {
      const rank = (s: string) =>
        s === "pendente" || s === "em_preparacao" ? 0 : 1;
      const byStatus = rank(a.status) - rank(b.status);
      if (byStatus !== 0) return byStatus;
      return (a.sentToKitchenAt ?? a.id).localeCompare(
        b.sentToKitchenAt ?? b.id
      );
    });

    results.push({
      orderId: order.id,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      items,
      createdAt: order.createdAt,
      barAlert: order.barAlert,
      barAlertAt: order.barAlertAt,
    });
  }

  return results.sort((a, b) => {
    if (a.barAlert && !b.barAlert) return -1;
    if (!a.barAlert && b.barAlert) return 1;
    return (
      new Date(a.items[0]?.sentToKitchenAt ?? a.createdAt).getTime() -
      new Date(b.items[0]?.sentToKitchenAt ?? b.createdAt).getTime()
    );
  });
}

export async function getCashierTables(): Promise<
  Array<{
    table: Table;
    order: Order;
    subtotal: number;
    itemCount: number;
  }>
> {
  const db = getDb();
  const tables = await db
    .select()
    .from(restaurantTables)
    .where(
      inArray(restaurantTables.status, ["a_pagar", "ocupada"])
    )
    .orderBy(asc(restaurantTables.number));

  const entries = await Promise.all(
    tables.map(async (tableRow) => {
      if (!tableRow.orderId) return null;

      const order = await fetchOrderRows(tableRow.orderId);
      if (!order || order.paidAt) return null;

      const activeItems = order.items.filter(
        (item) => item.status !== "cancelado" && !item.isAddon
      );
      const subtotal = activeItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      return {
        table: mapTable(tableRow),
        order,
        subtotal,
        itemCount: activeItems.reduce((sum, item) => sum + item.quantity, 0),
      };
    })
  );

  return entries.filter(
    (entry): entry is NonNullable<typeof entry> => entry !== null
  );
}

export async function seedRestaurantState(state: RestaurantState): Promise<void> {
  await saveState(state);
}

export async function cancelOrderItem(
  tableNumber: number,
  itemId: string
): Promise<Order> {
  const order = await getActiveOrder(tableNumber);
  if (!order) throw new Error("Pedido não encontrado");

  const item = order.items.find((entry) => entry.id === itemId);
  if (!item) throw new Error("Item não encontrado");
  if (item.status === "cancelado") throw new Error("Item já cancelado");
  if (item.status === "entregue") {
    throw new Error("Não é possível cancelar item já entregue");
  }
  if (item.status === "pronto") {
    throw new Error(
      item.skipKitchen
        ? "Não é possível cancelar — a bebida já está pronta no bar"
        : "Não é possível cancelar — o prato já está pronto na cozinha"
    );
  }

  const db = getDb();
  const now = new Date().toISOString();

  await db
    .update(orderItems)
    .set({ status: "cancelado" })
    .where(eq(orderItems.id, itemId));

  await db
    .update(orders)
    .set({ updatedAt: now })
    .where(eq(orders.id, order.id));

  if (canModifyAfterKitchen(item) && !item.isAddon) {
    if (item.skipKitchen) {
      await setBarAlertForItem(order.id, tableNumber, item, "CANCELAR");
    } else {
      await setKitchenAlertForItem(order.id, tableNumber, item, "CANCELAR");
    }
  }

  await recordAuditLog({
    action: "item_cancel",
    actor: order.waiterName,
    tableNumber,
    orderId: order.id,
    detail: `Cancelado ${item.quantity}× ${item.name} (mesa ${tableNumber})`,
  });

  await touchRestaurantUpdated(now);
  return (await fetchOrderRows(order.id))!;
}

export async function updateOrderItemInOrder(
  tableNumber: number,
  itemId: string,
  payload: UpdateOrderItemPayload
): Promise<Order> {
  const order = await getActiveOrder(tableNumber);
  if (!order) throw new Error("Pedido não encontrado");

  const item = order.items.find((entry) => entry.id === itemId);
  if (!item) throw new Error("Item não encontrado");
  if (item.isAddon) throw new Error("Extras no prato são geridos pelo prato principal");
  if (item.status === "cancelado") throw new Error("Item cancelado");
  if (item.status === "entregue") {
    throw new Error("Não é possível alterar item já entregue");
  }
  if (item.status === "pronto") {
    throw new Error(
      item.skipKitchen
        ? "Não é possível alterar — a bebida já está pronta no bar"
        : "Não é possível alterar — o prato já está pronto na cozinha"
    );
  }

  const menuItem = await getCatalogItem(item.menuItemId);
  if (!menuItem) throw new Error("Item do menu não encontrado");

  const catalog = await loadCatalog();
  const resolveItem = (id: string) => catalog.items.find((i) => i.id === id);

  const nextCustomizations = payload.customizations ?? item.customizations;
  const nextNotes = payload.notes !== undefined ? payload.notes : item.notes;
  const nextQuantity =
    payload.quantity !== undefined
      ? Math.max(1, Math.min(20, payload.quantity))
      : item.quantity;

  if (
    item.status === "em_preparacao" &&
    payload.quantity !== undefined &&
    nextQuantity !== item.quantity
  ) {
    throw new Error(
      item.skipKitchen
        ? "Não é possível alterar quantidade — bebida já no bar"
        : "Não é possível alterar quantidade — prato já na cozinha"
    );
  }

  if (menuItem.optionGroups) {
    for (const group of menuItem.optionGroups) {
      if (group.required) {
        const hasSelection = nextCustomizations.some(
          (customization) => customization.groupId === group.id
        );
        if (!hasSelection) {
          throw new Error(`Seleção obrigatória: ${group.label}`);
        }
      }
    }
  }

  const changed =
    nextQuantity !== item.quantity ||
    nextNotes !== item.notes ||
    customizationsKey(nextCustomizations) !==
      customizationsKey(item.customizations);

  if (!changed) return order;

  item.quantity = nextQuantity;
  item.customizations = nextCustomizations;
  item.notes = nextNotes;
  item.price = calculateItemPrice(menuItem, nextCustomizations, resolveItem);
  const nextIngredients = buildKitchenChoices(menuItem, nextCustomizations);
  item.ingredients = menuItem.skipKitchen
    ? nextIngredients.filter(
        (line) => !/^como servir:\s*só a bebida$/i.test(line)
      )
    : nextIngredients;

  await updateOrderItemRecord(item);

  const now = new Date().toISOString();
  const db = getDb();
  await db
    .update(orders)
    .set({ updatedAt: now })
    .where(eq(orders.id, order.id));

  if (canModifyAfterKitchen(item)) {
    if (item.skipKitchen) {
      await setBarAlertForItem(order.id, tableNumber, item, "ALTERACAO");
    } else {
      await setKitchenAlertForItem(order.id, tableNumber, item, "ALTERACAO");
    }
  }

  await touchRestaurantUpdated(now);
  return (await fetchOrderRows(order.id))!;
}

export async function transferTable(
  fromTableNumber: number,
  toTableNumber: number
): Promise<{ fromTable: Table; toTable: Table; order: Order }> {
  assertTableNumber(fromTableNumber);
  assertTableNumber(toTableNumber);

  if (fromTableNumber === toTableNumber) {
    throw new Error("Escolha uma mesa diferente");
  }

  const db = getDb();
  const [fromTableRow] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, fromTableNumber))
    .limit(1);
  const [toTableRow] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, toTableNumber))
    .limit(1);

  if (!fromTableRow) throw new Error("Mesa de origem não encontrada");
  if (!toTableRow) throw new Error("Mesa de destino não encontrada");
  if (!fromTableRow.orderId) throw new Error("Mesa de origem sem pedido activo");

  const toActive = await getActiveOrder(toTableNumber);
  if (toActive) throw new Error("Mesa de destino já está ocupada");

  const order = await fetchOrderRows(fromTableRow.orderId);
  if (!order || order.paidAt) throw new Error("Pedido não encontrado");

  const now = new Date().toISOString();

  await db
    .update(orders)
    .set({ tableNumber: toTableNumber, updatedAt: now })
    .where(eq(orders.id, order.id));

  const [updatedToTable] = await db
    .update(restaurantTables)
    .set({
      status: fromTableRow.status,
      orderId: order.id,
      guestCount: fromTableRow.guestCount,
      openedAt: fromTableRow.openedAt,
    })
    .where(
      and(
        eq(restaurantTables.number, toTableNumber),
        eq(restaurantTables.status, "livre"),
        isNull(restaurantTables.orderId)
      )
    )
    .returning();

  if (!updatedToTable) {
    throw new Error("Mesa de destino já não está livre");
  }

  await db
    .update(restaurantTables)
    .set({
      status: "livre",
      orderId: null,
      guestCount: null,
      openedAt: null,
    })
    .where(eq(restaurantTables.number, fromTableNumber));

  await setKitchenAlert(
    order.id,
    `Mesa ${fromTableNumber} transferida para mesa ${toTableNumber}`
  );

  await recordAuditLog({
    action: "transfer_table",
    actor: order.waiterName,
    tableNumber: toTableNumber,
    orderId: order.id,
    detail: `Mesa ${fromTableNumber} → ${toTableNumber}`,
  });

  await touchRestaurantUpdated(now);

  const [updatedFromTable] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, fromTableNumber))
    .limit(1);

  const movedOrder = (await fetchOrderRows(order.id))!;
  return {
    fromTable: mapTable(updatedFromTable!),
    toTable: mapTable(updatedToTable),
    order: movedOrder,
  };
}

export async function mergeTables(
  primaryTableNumber: number,
  secondaryTableNumber: number
): Promise<{ primaryTable: Table; secondaryTable: Table; order: Order }> {
  assertTableNumber(primaryTableNumber);
  assertTableNumber(secondaryTableNumber);

  if (primaryTableNumber === secondaryTableNumber) {
    throw new Error("Escolha mesas diferentes");
  }

  const db = getDb();
  const [primaryTableRow] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, primaryTableNumber))
    .limit(1);
  const [secondaryTableRow] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, secondaryTableNumber))
    .limit(1);

  if (!primaryTableRow?.orderId) {
    throw new Error("Mesa principal sem pedido activo");
  }
  if (!secondaryTableRow?.orderId) {
    throw new Error("Mesa secundária sem pedido activo");
  }

  const primaryOrder = await fetchOrderRows(primaryTableRow.orderId);
  const secondaryOrder = await fetchOrderRows(secondaryTableRow.orderId);

  if (!primaryOrder || primaryOrder.paidAt) {
    throw new Error("Pedido principal não encontrado");
  }
  if (!secondaryOrder || secondaryOrder.paidAt) {
    throw new Error("Pedido secundário não encontrado");
  }

  const secondaryOrderId = secondaryOrder.id;

  const now = new Date().toISOString();

  await db
    .update(orderItems)
    .set({ orderId: primaryOrder.id })
    .where(eq(orderItems.orderId, secondaryOrderId));

  await db
    .update(restaurantTables)
    .set({
      status: "livre",
      orderId: null,
      guestCount: null,
      openedAt: null,
    })
    .where(
      and(
        eq(restaurantTables.number, secondaryTableNumber),
        eq(restaurantTables.orderId, secondaryOrderId)
      )
    );

  await db.delete(orders).where(eq(orders.id, secondaryOrderId));

  const mergedGuests =
    (primaryTableRow.guestCount ?? 0) + (secondaryTableRow.guestCount ?? 0);

  await db
    .update(restaurantTables)
    .set({
      guestCount: mergedGuests > 0 ? mergedGuests : primaryTableRow.guestCount,
      status:
        primaryTableRow.status === "a_pagar" ||
        secondaryTableRow.status === "a_pagar"
          ? "a_pagar"
          : "ocupada",
    })
    .where(eq(restaurantTables.number, primaryTableNumber));

  await db
    .update(restaurantTables)
    .set({
      status: "livre",
      orderId: null,
      guestCount: null,
      openedAt: null,
    })
    .where(eq(restaurantTables.number, secondaryTableNumber));

  await db
    .update(orders)
    .set({ updatedAt: now })
    .where(eq(orders.id, primaryOrder.id));

  await setKitchenAlert(
    primaryOrder.id,
    `Mesas ${primaryTableNumber} e ${secondaryTableNumber} juntadas numa conta (mesa ${primaryTableNumber})`
  );

  await recordAuditLog({
    action: "merge_tables",
    actor: primaryOrder.waiterName,
    tableNumber: primaryTableNumber,
    orderId: primaryOrder.id,
    detail: `Mesa ${secondaryTableNumber} juntada à mesa ${primaryTableNumber}`,
  });

  await touchRestaurantUpdated(now);

  const [updatedPrimary] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, primaryTableNumber))
    .limit(1);
  const [updatedSecondary] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, secondaryTableNumber))
    .limit(1);

  return {
    primaryTable: mapTable(updatedPrimary!),
    secondaryTable: mapTable(updatedSecondary!),
    order: (await fetchOrderRows(primaryOrder.id))!,
  };
}

export { calculateOrderTotal } from "./utils";
