import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { MenuOptionGroup } from "@/lib/types";

export const appMeta = pgTable("app_meta", {
  id: text("id").primaryKey(),
  lastUpdated: timestamp("last_updated", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
});

export const restaurantTables = pgTable("restaurant_tables", {
  number: integer("number").primaryKey(),
  status: text("status").notNull().default("livre"),
  orderId: uuid("order_id"),
  guestCount: integer("guest_count"),
  openedAt: timestamp("opened_at", { withTimezone: true, mode: "string" }),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey(),
    tableNumber: integer("table_number").notNull(),
    waiterName: text("waiter_name").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true, mode: "string" }),
    paidAt: timestamp("paid_at", { withTimezone: true, mode: "string" }),
    paymentMethod: text("payment_method"),
    tip: numeric("tip", { precision: 10, scale: 2 }),
    kitchenAlert: text("kitchen_alert"),
    kitchenAlertAt: timestamp("kitchen_alert_at", {
      withTimezone: true,
      mode: "string",
    }),
    paymentCash: numeric("payment_cash", { precision: 10, scale: 2 }),
    paymentCard: numeric("payment_card", { precision: 10, scale: 2 }),
  },
  (table) => ({
    paidAtIdx: index("orders_paid_at_idx").on(table.paidAt),
    tableNumberIdx: index("orders_table_number_idx").on(table.tableNumber),
  })
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    menuItemId: text("menu_item_id").notNull(),
    name: text("name").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    notes: text("notes").notNull().default(""),
    ingredients: jsonb("ingredients").$type<string[]>().notNull().default([]),
    kitchenNotes: text("kitchen_notes"),
    status: text("status").notNull(),
    isAddon: boolean("is_addon").notNull().default(false),
    parentItemId: uuid("parent_item_id"),
    skipKitchen: boolean("skip_kitchen").notNull().default(false),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    sentToKitchenAt: timestamp("sent_to_kitchen_at", {
      withTimezone: true,
      mode: "string",
    }),
    readyAt: timestamp("ready_at", { withTimezone: true, mode: "string" }),
  },
  (table) => ({
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
    statusIdx: index("order_items_status_idx").on(table.status),
  })
);

export const orderItemCustomizations = pgTable(
  "order_item_customizations",
  {
    id: serial("id").primaryKey(),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    groupId: text("group_id").notNull(),
    groupLabel: text("group_label").notNull(),
    optionId: text("option_id").notNull(),
    optionLabel: text("option_label").notNull(),
  },
  (table) => ({
    orderItemIdIdx: index("order_item_customizations_order_item_id_idx").on(
      table.orderItemId
    ),
  })
);

export const menuCategories = pgTable("menu_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  note: text("note"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const menuItems = pgTable(
  "menu_items",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => menuCategories.id),
    name: text("name").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    description: text("description"),
    ingredients: jsonb("ingredients").$type<string[]>().notNull().default([]),
    kitchenNotes: text("kitchen_notes"),
    optionGroups: jsonb("option_groups").$type<MenuOptionGroup[]>(),
    isAddon: boolean("is_addon").notNull().default(false),
    canBeAddon: boolean("can_be_addon").notNull().default(false),
    excludesFries: boolean("excludes_fries").notNull().default(false),
    skipKitchen: boolean("skip_kitchen").notNull().default(false),
    active: boolean("active").notNull().default(true),
  },
  (table) => ({
    categoryIdIdx: index("menu_items_category_id_idx").on(table.categoryId),
    activeIdx: index("menu_items_active_idx").on(table.active),
  })
);
