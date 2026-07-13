import { asc, eq, inArray, isNull } from "drizzle-orm";
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
import type {
  AddOrderItemPayload,
  CreateOrderPayload,
  KitchenTicketItem,
  Order,
  OrderItem,
  OrderItemCustomization,
  OrderItemStatus,
  PaymentPayload,
  RestaurantState,
  Table,
  TableStatus,
} from "./types";

const RESTAURANT_META_ID = "restaurant";
const TABLE_COUNT = 20;

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
    });

    for (const item of order.items) {
      await insertOrderItem(order.id, item);
    }
  }

  await touchRestaurantUpdated(updatedAt);
}

export async function getState(): Promise<RestaurantState> {
  return loadState();
}

export async function openTable(
  tableNumber: number,
  waiterName: string,
  guestCount?: number
): Promise<{ table: Table; order: Order }> {
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

  const now = new Date().toISOString();
  const order: Order = {
    id: uuidv4(),
    tableNumber,
    items: [],
    waiterName,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(orders).values({
    id: order.id,
    tableNumber,
    waiterName,
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
    .where(eq(restaurantTables.number, tableNumber))
    .returning();

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
  let order = await getActiveOrder(tableNumber);
  if (!order) {
    throw new Error("Mesa sem pedido ativo. Abra a mesa primeiro.");
  }

  const menuItem = await getCatalogItem(payload.menuItemId);
  if (!menuItem || menuItem.active === false) {
    throw new Error("Item do menu não encontrado");
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
    const db = getDb();
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

  const orderItem: OrderItem = {
    id: uuidv4(),
    menuItemId: menuItem.id,
    name: menuItem.name,
    price: calculateItemPrice(menuItem, payload.customizations, resolveItem),
    quantity: payload.quantity,
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
  const db = getDb();
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

  for (const item of order.items) {
    if (item.status !== "pendente") continue;
    if (item.skipKitchen) continue;
    if (itemIds && !itemIds.includes(item.id)) continue;

    item.ingredients = await resolveKitchenChoices(item);
    item.status = "em_preparacao";
    item.sentToKitchenAt = now;
    await updateOrderItemRecord(item);
  }

  const db = getDb();
  await db
    .update(orders)
    .set({ updatedAt: now })
    .where(eq(orders.id, order.id));
  await touchRestaurantUpdated(now);

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

  const now = new Date().toISOString();
  const readyAt = status === "pronto" ? now : itemRow.readyAt;

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
  const db = getDb();
  const [table] = await db
    .select()
    .from(restaurantTables)
    .where(eq(restaurantTables.number, tableNumber))
    .limit(1);

  if (!table?.orderId) throw new Error("Pedido não encontrado");

  const order = await fetchOrderRows(table.orderId);
  if (!order) throw new Error("Pedido não encontrado");

  const subtotal = order.items
    .filter((item) => item.status !== "cancelado" && !item.isAddon)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const now = new Date().toISOString();
  const tip = payload.tip ?? 0;

  await db
    .update(orders)
    .set({
      paidAt: now,
      paymentMethod: payload.paymentMethod,
      tip: String(tip),
      closedAt: now,
      updatedAt: now,
    })
    .where(eq(orders.id, order.id));

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

  const paidOrder = (await fetchOrderRows(order.id))!;
  return {
    table: mapTable(updatedTable),
    order: paidOrder,
    total: subtotal + tip,
  };
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
  choices: string[]
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
  };
}

export async function getKitchenOrders(): Promise<
  Array<{
    orderId: string;
    tableNumber: number;
    waiterName: string;
    items: KitchenTicketItem[];
    createdAt: string;
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
  }> = [];

  for (const orderRow of activeOrders) {
    const order = await fetchOrderRows(orderRow.id);
    if (!order) continue;

    const visibleItems = order.items.filter(
      (item) =>
        !item.isAddon &&
        !item.skipKitchen &&
        (item.status === "em_preparacao" ||
          item.status === "pronto" ||
          (item.status === "pendente" && item.sentToKitchenAt))
    );

    if (visibleItems.length === 0) continue;

    const items = await Promise.all(
      visibleItems.map(async (item) => {
        const choices = await resolveKitchenChoices(item);
        const stored = JSON.stringify(item.ingredients);
        const next = JSON.stringify(choices);

        if (stored !== next) {
          item.ingredients = choices;
          await db
            .update(orderItems)
            .set({ ingredients: choices })
            .where(eq(orderItems.id, item.id));
          await touchRestaurantUpdated();
        }

        return toKitchenTicketItem(item, choices);
      })
    );

    results.push({
      orderId: order.id,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      items,
      createdAt: order.createdAt,
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

export { calculateOrderTotal } from "./utils";
