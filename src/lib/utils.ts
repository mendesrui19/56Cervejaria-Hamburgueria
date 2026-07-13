import type { Order } from "./types";

export function calculateOrderTotal(order: Order): number {
  return order.items
    .filter((i) => i.status !== "cancelado" && !i.isAddon)
    .reduce((sum, i) => sum + i.price * i.quantity, 0);
}
