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
import {
  formatKitchenItemLabel,
  resolveItemKitchenZone,
  setKitchenAlert,
  setKitchenAlertForItem,
} from "./kitchen-alerts";
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
    throw new Error("Mesa a pagar — só bar/bebidas");
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

  const ingredients = menuItem.skipKitchen
    ? []
    : buildKitchenChoices(menuItem, payload.customizations);

  const quantity = Math.max(1, Math.min(20, payload.quantity || 1));

  if (!menuItem.isAddon && !payload.parentItemId) {
    const existingLine = order.items.find(
      (item) =>
        item.status === "pendente" &&
        !item.isAddon &&
        item.menuItemId === menuItem.id &&
        item.notes === payload.notes &&
        customizationsKey(item.customizations) ===
          customizationsKey(payload.customizations)
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

  const orderItem: OrderItem = {
    id: uuidv4(),
    menuItemId: menuItem.id,
    name: menuItem.name,
    price: calculateItemPrice(menuItem, payload.customizations, resolveItem),
    quantity,
    customizations: payload.customizations,
    notes: payload.notes,
    ingredients,
    kitchenNotes: menuItem.skipKitchen ? undefined : menuItem.kitchenNotes,
    status: "pendente",
    isAddon: menuItem.isAddon ?? false,
    skipKitchen: menuItem.skipKitchen ?? false,
    parentItemId: payload.parentItemId,
    createdAt: new Date().toISOString(),
  };

  await insertOrderItem(order.id, orderItem);

  const now = new Date().toISOString();
  await db
    .update(orders)
    .set({ updatedAt: now })
    .where(eq(orders.id, order.id));
  await db
    .update(restaurantTables)
    .set({ status: "ocupada" })
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

  const newlySent: OrderItem[] = [];

  for (const item of order.items) {
    if (item.status !== "pendente") continue;
    if (item.skipKitchen) continue;
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

  if (hadKitchenActivity && newlySent.length > 0) {
    if (newlySent.length === 1) {
      await setKitchenAlertForItem(
        order.id,
        tableNumber,
        newlySent[0]!,
        "NOVO",
        categoryByMenuId
      );
    } else {
      const byZone = new Map<KitchenZone, string[]>();
      for (const item of newlySent) {
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

  assertKitchenStatusTransition(itemRow.status as OrderItemStatus, status);

  const now = new Date().toISOString();
  const readyAt =
    status === "pronto"
      ? now
      : status === "em_preparacao"
      ? null
      : itemRow.readyAt;

  await db
    .update(orderItems)
    .set({
      status,
      readyAt: readyAt ?? null,
    })
    .where(eq(orderItems.id, itemId));

  await db
    .update(orders)
    .set({ updatedAt: now })
    .where(eq(orders.id, itemRow.orderId));

  const order = await fetchOrderRows(itemRow.orderId);
  if (!order) throw new Error("Pedido não encontrado");

  const kitchenItems = order.items.filter(
    (item) =>
      !item.skipKitchen && !item.isAddon && item.status !== "cancelado"
  );

  const allDeliveredOrReady = kitchenItems.every(
    (item) => item.status === "entregue" || item.status === "pronto"
  );
  const hasReady = kitchenItems.some((item) => item.status === "pronto");

  if (hasReady && allDeliveredOrReady) {
    await db
      .update(restaurantTables)
      .set({ status: "a_pagar" })
      .where(eq(restaurantTables.number, order.tableNumber));
  }

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
    throw new Error("Só é possível remover itens ainda não enviados à cozinha");
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

  return (await fetchOrderRows(order.id))!;
}

export async function requestBill(tableNumber: number): Promise<Table> {
  const db = getDb();
  const [updatedTable] = await db
    .update(restaurantTables)
    .set({ status: "a_pagar" })
    .where(eq(restaurantTables.number, tableNumber))
    .returning();

  if (!updatedTable) throw new Error("Mesa não encontrada");

  const now = new Date().toISOString();
  await touchRestaurantUpdated(now);
  return mapTable(updatedTable);
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

  const now = new Date().toISOString();
  const total = subtotal + tip;

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

  for (const item of order.items) {
    if (item.status === "cancelado" || item.status === "entregue") continue;
    await db
      .update(orderItems)
      .set({ status: "entregue" })
      .where(eq(orderItems.id, item.id));
  }

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

  for (const item of order.items) {
    if (item.status === "cancelado") continue;

    const nextStatus = item.skipKitchen
      ? "pendente"
      : item.sentToKitchenAt
      ? "pronto"
      : "pendente";

    await db
      .update(orderItems)
      .set({
        status: nextStatus,
        readyAt: nextStatus === "pronto" ? item.readyAt ?? now : null,
      })
      .where(eq(orderItems.id, item.id));
  }

  const refreshed = (await fetchOrderRows(order.id))!;
  const kitchenItems = refreshed.items.filter(
    (item) =>
      !item.skipKitchen && !item.isAddon && item.status !== "cancelado"
  );
  const hasReady = kitchenItems.some((item) => item.status === "pronto");
  const allReady = kitchenItems.every(
    (item) => item.status === "pronto" || item.status === "entregue"
  );

  await db
    .update(restaurantTables)
    .set({
      status: hasReady && allReady ? "a_pagar" : "ocupada",
      orderId: order.id,
      openedAt: table.openedAt ?? now,
    })
    .where(eq(restaurantTables.number, order.tableNumber));

  await touchRestaurantUpdated(now);
  return (await fetchOrderRows(order.id))!;
}

async function resolveKitchenChoices(item: OrderItem): Promise<string[]> {
  if (item.skipKitchen) return [];

  const menuItem = await getCatalogItem(item.menuItemId);
  return menuItem
    ? buildKitchenChoices(menuItem, item.customizations)
    : buildKitchenChoicesFromCustomizations(item.customizations);
}

function toKitchenTicketItem(
  item: OrderItem,
  choices: string[],
  kitchenZone: KitchenZone
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
    kitchenZone,
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
    throw new Error("Não é possível cancelar — o prato já está pronto na cozinha");
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

  if (
    canModifyAfterKitchen(item) &&
    !item.skipKitchen &&
    !item.isAddon
  ) {
    await setKitchenAlertForItem(order.id, tableNumber, item, "CANCELAR");
  }

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
    throw new Error("Não é possível alterar — o prato já está pronto na cozinha");
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
      "Não é possível alterar quantidade — prato já na cozinha"
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
  item.ingredients = menuItem.skipKitchen
    ? []
    : buildKitchenChoices(menuItem, nextCustomizations);

  await updateOrderItemRecord(item);

  const now = new Date().toISOString();
  const db = getDb();
  await db
    .update(orders)
    .set({ updatedAt: now })
    .where(eq(orders.id, order.id));

  if (canModifyAfterKitchen(item) && !item.skipKitchen) {
    await setKitchenAlertForItem(order.id, tableNumber, item, "ALTERACAO");
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
