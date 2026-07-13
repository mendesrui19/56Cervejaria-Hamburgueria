import "dotenv/config";
import { loadCatalog } from "../src/lib/catalog";
import { loadState } from "../src/lib/store";

async function main() {
  const catalog = await loadCatalog();
  const state = await loadState();

  console.log("categories:", catalog.categories.length);
  console.log("menu items:", catalog.items.length);
  console.log("tables:", state.tables.length);
  console.log("orders:", state.orders.length);
  console.log("paid orders:", state.orders.filter((order) => order.paidAt).length);
}

main().catch(console.error);
