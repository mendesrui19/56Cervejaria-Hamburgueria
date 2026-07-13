import "dotenv/config";
import { promises as fs } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";
import { seedCatalog } from "../src/lib/catalog";
import { seedRestaurantState } from "../src/lib/store";
import type { MenuCatalog, RestaurantState } from "../src/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function ensureSchema() {
  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    CREATE TABLE IF NOT EXISTS app_meta (
      id text PRIMARY KEY,
      last_updated timestamptz NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS restaurant_tables (
      number integer PRIMARY KEY,
      status text NOT NULL DEFAULT 'livre',
      order_id uuid,
      guest_count integer,
      opened_at timestamptz
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id uuid PRIMARY KEY,
      table_number integer NOT NULL,
      waiter_name text NOT NULL,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL,
      closed_at timestamptz,
      paid_at timestamptz,
      payment_method text,
      tip numeric(10, 2),
      kitchen_alert text,
      kitchen_alert_at timestamptz,
      payment_cash numeric(10, 2),
      payment_card numeric(10, 2)
    )
  `;

  await sql`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS kitchen_alert text
  `;

  await sql`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS kitchen_alert_at timestamptz
  `;

  await sql`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_cash numeric(10, 2)
  `;

  await sql`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_card numeric(10, 2)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS orders_paid_at_idx ON orders (paid_at)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS orders_table_number_idx ON orders (table_number)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id uuid PRIMARY KEY,
      order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id text NOT NULL,
      name text NOT NULL,
      price numeric(10, 2) NOT NULL,
      quantity integer NOT NULL,
      notes text NOT NULL DEFAULT '',
      ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
      kitchen_notes text,
      status text NOT NULL,
      is_addon boolean NOT NULL DEFAULT false,
      parent_item_id uuid,
      skip_kitchen boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL,
      sent_to_kitchen_at timestamptz,
      ready_at timestamptz
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS order_items_status_idx ON order_items (status)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_item_customizations (
      id serial PRIMARY KEY,
      order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
      group_id text NOT NULL,
      group_label text NOT NULL,
      option_id text NOT NULL,
      option_label text NOT NULL
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS order_item_customizations_order_item_id_idx
    ON order_item_customizations (order_item_id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS menu_categories (
      id text PRIMARY KEY,
      name text NOT NULL,
      note text,
      sort_order integer NOT NULL DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS menu_items (
      id text PRIMARY KEY,
      category_id text NOT NULL REFERENCES menu_categories(id),
      name text NOT NULL,
      price numeric(10, 2) NOT NULL,
      description text,
      ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
      kitchen_notes text,
      option_groups jsonb,
      is_addon boolean NOT NULL DEFAULT false,
      can_be_addon boolean NOT NULL DEFAULT false,
      excludes_fries boolean NOT NULL DEFAULT false,
      skip_kitchen boolean NOT NULL DEFAULT false,
      active boolean NOT NULL DEFAULT true
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS menu_items_category_id_idx ON menu_items (category_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS menu_items_active_idx ON menu_items (active)
  `;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL em falta no .env");
  }

  console.log("A criar schema PostgreSQL...");
  await ensureSchema();

  const catalogPath = path.join(DATA_DIR, "menu-catalog.json");
  const catalog = await readJson<MenuCatalog>(catalogPath);

  if (catalog) {
    console.log("A importar catálogo do menu...");
    await seedCatalog(catalog);
  } else {
    console.log("Catálogo JSON não encontrado — a usar defaults do menu.ts");
    const { loadCatalog } = await import("../src/lib/catalog");
    await loadCatalog();
  }

  const statePath = path.join(DATA_DIR, "restaurant-state.json");
  const state = await readJson<RestaurantState>(statePath);

  if (state) {
    console.log("A importar mesas e pedidos...");
    await seedRestaurantState(state);
  } else {
    console.log("Estado do restaurante não encontrado — a inicializar mesas...");
    const { loadState } = await import("../src/lib/store");
    await loadState();
  }

  console.log("Base de dados pronta.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
