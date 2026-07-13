import { loadState } from "./store";
import { getPeriodRange } from "./period";
import type {
  AdminKPIs,
  AnalyticsPeriod,
  Order,
  OrderHistoryEntry,
  PaymentMethod,
} from "./types";

function orderSubtotal(order: Order): number {
  return order.items
    .filter((i) => i.status !== "cancelado" && !i.isAddon)
    .reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function orderItemCount(order: Order): number {
  return order.items
    .filter((i) => i.status !== "cancelado" && !i.isAddon)
    .reduce((sum, i) => sum + i.quantity, 0);
}

function isOrderInRange(order: Order, start: Date, end: Date): boolean {
  if (!order.paidAt) return false;
  const paid = new Date(order.paidAt);
  return paid >= start && paid <= end;
}

export async function getCompletedOrders(
  period: AnalyticsPeriod,
  reference = new Date()
): Promise<Order[]> {
  const state = await loadState();
  const { start, end } = getPeriodRange(period, reference);
  return state.orders
    .filter((o) => isOrderInRange(o, start, end))
    .sort(
      (a, b) =>
        new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime()
    );
}

export async function getOrderHistory(
  period: AnalyticsPeriod,
  reference = new Date(),
  tableNumber?: number
): Promise<OrderHistoryEntry[]> {
  let orders = await getCompletedOrders(period, reference);
  if (tableNumber) {
    orders = orders.filter((o) => o.tableNumber === tableNumber);
  }

  return orders.map((order) => {
    const subtotal = orderSubtotal(order);
    const tip = order.tip ?? 0;
    const items = order.items
      .filter((i) => i.status !== "cancelado" && !i.isAddon)
      .map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      }));

    return {
      id: order.id,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      createdAt: order.createdAt,
      paidAt: order.paidAt!,
      paymentMethod: order.paymentMethod,
      subtotal,
      tip,
      total: subtotal + tip,
      itemCount: orderItemCount(order),
      items,
    };
  });
}

export async function getAdminKPIs(
  period: AnalyticsPeriod,
  reference = new Date()
): Promise<AdminKPIs> {
  const orders = await getCompletedOrders(period, reference);
  const { start, end } = getPeriodRange(period, reference);

  let subtotal = 0;
  let tips = 0;
  let itemsSold = 0;
  const itemMap = new Map<string, { quantity: number; revenue: number }>();
  const tableMap = new Map<number, { orders: number; revenue: number }>();
  const paymentMap = new Map<PaymentMethod, { count: number; amount: number }>();
  const waiterMap = new Map<string, { orders: number; revenue: number }>();

  for (const order of orders) {
    const orderSub = orderSubtotal(order);
    const orderTip = order.tip ?? 0;
    const orderTotal = orderSub + orderTip;

    subtotal += orderSub;
    tips += orderTip;
    itemsSold += orderItemCount(order);

    const table = tableMap.get(order.tableNumber) ?? { orders: 0, revenue: 0 };
    table.orders += 1;
    table.revenue += orderTotal;
    tableMap.set(order.tableNumber, table);

    const waiter = waiterMap.get(order.waiterName) ?? { orders: 0, revenue: 0 };
    waiter.orders += 1;
    waiter.revenue += orderTotal;
    waiterMap.set(order.waiterName, waiter);

    if (order.paymentMethod) {
      const pay = paymentMap.get(order.paymentMethod) ?? {
        count: 0,
        amount: 0,
      };
      pay.count += 1;
      pay.amount += orderTotal;
      paymentMap.set(order.paymentMethod, pay);
    }

    for (const item of order.items) {
      if (item.status === "cancelado" || item.isAddon) continue;
      const key = item.name;
      const entry = itemMap.get(key) ?? { quantity: 0, revenue: 0 };
      entry.quantity += item.quantity;
      entry.revenue += item.price * item.quantity;
      itemMap.set(key, entry);
    }
  }

  const revenue = subtotal + tips;
  const orderCount = orders.length;

  return {
    period,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    revenue,
    tips,
    subtotal,
    orderCount,
    avgTicket: orderCount > 0 ? revenue / orderCount : 0,
    itemsSold,
    topItems: [...itemMap.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),
    byTable: [...tableMap.entries()]
      .map(([tableNumber, data]) => ({ tableNumber, ...data }))
      .sort((a, b) => b.revenue - a.revenue),
    byPayment: [...paymentMap.entries()].map(([method, data]) => ({
      method,
      ...data,
    })),
    byWaiter: [...waiterMap.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue),
  };
}
