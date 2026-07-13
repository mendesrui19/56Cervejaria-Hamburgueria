import type {
  MenuCatalog,
  MenuCategory,
  MenuItem,
  Order,
  OrderItem,
  OrderItemCustomization,
  PaymentMethod,
  RestaurantState,
  Table,
  TableStatus,
} from "@/lib/types";
import type {
  menuCategories,
  menuItems,
  orderItemCustomizations,
  orderItems,
  orders,
  restaurantTables,
} from "./schema";

type TableRow = typeof restaurantTables.$inferSelect;
type OrderRow = typeof orders.$inferSelect;
type OrderItemRow = typeof orderItems.$inferSelect;
type CustomizationRow = typeof orderItemCustomizations.$inferSelect;
type CategoryRow = typeof menuCategories.$inferSelect;
type MenuItemRow = typeof menuItems.$inferSelect;

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}

export function mapTable(row: TableRow): Table {
  return {
    number: row.number,
    status: row.status as TableStatus,
    orderId: row.orderId ?? undefined,
    guestCount: row.guestCount ?? undefined,
    openedAt: row.openedAt ?? undefined,
  };
}

export function mapCustomization(
  row: CustomizationRow
): OrderItemCustomization {
  return {
    groupId: row.groupId,
    groupLabel: row.groupLabel,
    optionId: row.optionId,
    optionLabel: row.optionLabel,
  };
}

export function mapOrderItem(
  row: OrderItemRow,
  customizations: OrderItemCustomization[]
): OrderItem {
  return {
    id: row.id,
    menuItemId: row.menuItemId,
    name: row.name,
    price: toNumber(row.price),
    quantity: row.quantity,
    customizations,
    notes: row.notes,
    ingredients: row.ingredients ?? [],
    kitchenNotes: row.kitchenNotes ?? undefined,
    status: row.status as OrderItem["status"],
    isAddon: row.isAddon,
    parentItemId: row.parentItemId ?? undefined,
    skipKitchen: row.skipKitchen,
    createdAt: row.createdAt,
    sentToKitchenAt: row.sentToKitchenAt ?? undefined,
    readyAt: row.readyAt ?? undefined,
  };
}

export function mapOrder(
  row: OrderRow,
  items: OrderItem[]
): Order {
  return {
    id: row.id,
    tableNumber: row.tableNumber,
    items,
    waiterName: row.waiterName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    closedAt: row.closedAt ?? undefined,
    paidAt: row.paidAt ?? undefined,
    paymentMethod: (row.paymentMethod as PaymentMethod | null) ?? undefined,
    tip: row.tip === null ? undefined : toNumber(row.tip),
    paymentCash:
      row.paymentCash === null || row.paymentCash === undefined
        ? undefined
        : toNumber(row.paymentCash),
    paymentCard:
      row.paymentCard === null || row.paymentCard === undefined
        ? undefined
        : toNumber(row.paymentCard),
    kitchenAlert: row.kitchenAlert ?? undefined,
    kitchenAlertAt: row.kitchenAlertAt ?? undefined,
  };
}

export function assembleRestaurantState(
  lastUpdated: string,
  tableRows: TableRow[],
  orderRows: OrderRow[],
  itemRows: OrderItemRow[],
  customizationRows: CustomizationRow[]
): RestaurantState {
  const customizationsByItem = new Map<string, OrderItemCustomization[]>();

  for (const row of customizationRows) {
    const list = customizationsByItem.get(row.orderItemId) ?? [];
    list.push(mapCustomization(row));
    customizationsByItem.set(row.orderItemId, list);
  }

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const row of itemRows) {
    const list = itemsByOrder.get(row.orderId) ?? [];
    list.push(
      mapOrderItem(row, customizationsByItem.get(row.id) ?? [])
    );
    itemsByOrder.set(row.orderId, list);
  }

  return {
    tables: tableRows.map(mapTable),
    orders: orderRows.map((row) =>
      mapOrder(row, itemsByOrder.get(row.id) ?? [])
    ),
    lastUpdated,
  };
}

export function mapMenuCategory(row: CategoryRow): MenuCategory {
  return {
    id: row.id,
    name: row.name,
    note: row.note ?? undefined,
  };
}

export function mapMenuItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    price: toNumber(row.price),
    categoryId: row.categoryId,
    description: row.description ?? undefined,
    ingredients: row.ingredients ?? [],
    kitchenNotes: row.kitchenNotes ?? undefined,
    optionGroups: row.optionGroups ?? undefined,
    isAddon: row.isAddon,
    canBeAddon: row.canBeAddon,
    excludesFries: row.excludesFries,
    skipKitchen: row.skipKitchen,
    active: row.active,
  };
}

export function assembleMenuCatalog(
  updatedAt: string,
  categoryRows: CategoryRow[],
  itemRows: MenuItemRow[]
): MenuCatalog {
  return {
    categories: categoryRows.map(mapMenuCategory),
    items: itemRows.map(mapMenuItem),
    updatedAt,
  };
}
