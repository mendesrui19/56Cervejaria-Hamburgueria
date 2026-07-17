import { loadState } from "./store";
import {
  formatPeriodLabel,
  getPeriodRange,
  getPreviousPeriodReference,
  getServiceDayStart,
  parseDateParam,
  toDateParam,
} from "./period";
import type {
  AdminComparison,
  AdminDailyRow,
  AdminHourlyRow,
  AdminKPIs,
  AdminPaymentBreakdown,
  AnalyticsPeriod,
  DayCloseSummary,
  Order,
  OrderHistoryEntry,
  PaymentMethod,
  RecentPaymentEntry,
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

function orderTotal(order: Order): number {
  return orderSubtotal(order) + (order.tip ?? 0);
}

function isOrderInRange(order: Order, start: Date, end: Date): boolean {
  if (!order.paidAt) return false;
  const paid = new Date(order.paidAt);
  return paid >= start && paid <= end;
}

function orderServiceDayKey(paidAt: string): string {
  return toDateParam(getServiceDayStart(new Date(paidAt)));
}

function dayLabel(dateKey: string): string {
  return parseDateParam(dateKey).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
  });
}

function computePaymentBreakdown(orders: Order[]): AdminPaymentBreakdown {
  let dinheiro = 0;
  let multibanco = 0;
  let mbway = 0;
  let mistoCash = 0;
  let mistoCard = 0;

  for (const order of orders) {
    const total = orderTotal(order);
    switch (order.paymentMethod) {
      case "dinheiro":
        dinheiro += total;
        break;
      case "multibanco":
        multibanco += total;
        break;
      case "mbway":
        mbway += total;
        break;
      case "misto":
        mistoCash += order.paymentCash ?? 0;
        mistoCard += order.paymentCard ?? 0;
        break;
      default:
        break;
    }
  }

  return {
    dinheiro,
    multibanco,
    mbway,
    mistoCash,
    mistoCard,
    cashInDrawer: dinheiro + mistoCash,
  };
}

function computeCancelledStats(orders: Order[]): { count: number; value: number } {
  let count = 0;
  let value = 0;

  for (const order of orders) {
    for (const item of order.items) {
      if (item.status !== "cancelado" || item.isAddon) continue;
      count += item.quantity;
      value += item.price * item.quantity;
    }
  }

  return { count, value };
}

function computeAvgTableMinutes(orders: Order[]): number {
  let totalMs = 0;
  let count = 0;
  const maxMs = 24 * 60 * 60 * 1000;

  for (const order of orders) {
    if (!order.paidAt || !order.createdAt) continue;
    const ms =
      new Date(order.paidAt).getTime() - new Date(order.createdAt).getTime();
    if (ms <= 0 || ms > maxMs) continue;
    totalMs += ms;
    count += 1;
  }

  return count > 0 ? totalMs / count / 60_000 : 0;
}

function buildByDay(
  orders: Order[],
  period: AnalyticsPeriod,
  reference: Date
): AdminDailyRow[] {
  if (period === "day") return [];

  const map = new Map<string, { revenue: number; orders: number }>();
  const rows: AdminDailyRow[] = [];

  if (period === "week") {
    const anchor = parseDateParam(toDateParam(reference));
    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(d.getDate() - i);
      const key = toDateParam(d);
      map.set(key, { revenue: 0, orders: 0 });
      rows.push({ date: key, label: dayLabel(key), revenue: 0, orders: 0 });
    }
  } else {
    const year = reference.getFullYear();
    const month = reference.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = toDateParam(new Date(year, month, d));
      map.set(key, { revenue: 0, orders: 0 });
      rows.push({ date: key, label: dayLabel(key), revenue: 0, orders: 0 });
    }
  }

  for (const order of orders) {
    const key = orderServiceDayKey(order.paidAt!);
    const entry = map.get(key);
    if (!entry) continue;
    entry.revenue += orderTotal(order);
    entry.orders += 1;
  }

  return rows.map((row) => {
    const data = map.get(row.date)!;
    return { ...row, revenue: data.revenue, orders: data.orders };
  });
}

function buildByHour(orders: Order[]): AdminHourlyRow[] {
  const map = new Map<number, { revenue: number; orders: number }>();

  for (const order of orders) {
    const hour = new Date(order.paidAt!).getHours();
    const entry = map.get(hour) ?? { revenue: 0, orders: 0 };
    entry.revenue += orderTotal(order);
    entry.orders += 1;
    map.set(hour, entry);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hour, data]) => ({
      hour,
      label: `${String(hour).padStart(2, "0")}h`,
      revenue: data.revenue,
      orders: data.orders,
    }));
}

async function buildComparison(
  period: AnalyticsPeriod,
  reference: Date,
  currentRevenue: number,
  currentOrders: number
): Promise<AdminComparison> {
  const prevRef = getPreviousPeriodReference(period, reference);
  const prevOrders = await getCompletedOrders(period, prevRef);
  let previousRevenue = 0;

  for (const order of prevOrders) {
    previousRevenue += orderTotal(order);
  }

  const previousOrders = prevOrders.length;
  const revenueChange = currentRevenue - previousRevenue;

  return {
    previousRevenue,
    previousOrders,
    revenueChange,
    revenueChangePct:
      previousRevenue > 0 ? (revenueChange / previousRevenue) * 100 : 0,
    ordersChange: currentOrders - previousOrders,
  };
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

    const cancelledItems = order.items
      .filter((i) => i.status === "cancelado" && !i.isAddon)
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
      paymentCash: order.paymentCash,
      paymentCard: order.paymentCard,
      subtotal,
      tip,
      total: subtotal + tip,
      itemCount: orderItemCount(order),
      items,
      cancelledItems,
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
  const waiterMap = new Map<
    string,
    { orders: number; revenue: number; tips: number }
  >();

  for (const order of orders) {
    const orderSub = orderSubtotal(order);
    const orderTip = order.tip ?? 0;
    const orderRev = orderSub + orderTip;

    subtotal += orderSub;
    tips += orderTip;
    itemsSold += orderItemCount(order);

    const table = tableMap.get(order.tableNumber) ?? { orders: 0, revenue: 0 };
    table.orders += 1;
    table.revenue += orderRev;
    tableMap.set(order.tableNumber, table);

    const waiter = waiterMap.get(order.waiterName) ?? {
      orders: 0,
      revenue: 0,
      tips: 0,
    };
    waiter.orders += 1;
    waiter.revenue += orderRev;
    waiter.tips += orderTip;
    waiterMap.set(order.waiterName, waiter);

    if (order.paymentMethod) {
      const pay = paymentMap.get(order.paymentMethod) ?? {
        count: 0,
        amount: 0,
      };
      pay.count += 1;
      pay.amount += orderRev;
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
  const cancelledItems = computeCancelledStats(orders);
  const cancelBase = subtotal + cancelledItems.value;
  const cancelRate = cancelBase > 0 ? cancelledItems.value / cancelBase : 0;

  return {
    period,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    periodLabel: formatPeriodLabel(period, reference),
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
      .map(([name, data]) => ({
        name,
        orders: data.orders,
        revenue: data.revenue,
        tips: data.tips,
        avgTicket: data.orders > 0 ? data.revenue / data.orders : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue),
    payments: computePaymentBreakdown(orders),
    byDay: buildByDay(orders, period, reference),
    byHour: buildByHour(orders),
    cancelledItems,
    cancelRate,
    avgTableMinutes: computeAvgTableMinutes(orders),
    comparison: await buildComparison(period, reference, revenue, orderCount),
  };
}

export async function getDayCloseSummary(
  reference = new Date()
): Promise<DayCloseSummary> {
  const orders = await getCompletedOrders("day", reference);
  const payments = computePaymentBreakdown(orders);

  let subtotal = 0;
  let tips = 0;

  for (const order of orders) {
    subtotal += orderSubtotal(order);
    tips += order.tip ?? 0;
  }

  const paymentEntries: RecentPaymentEntry[] = orders.map((order) => {
    const orderSub = orderSubtotal(order);
    const tip = order.tip ?? 0;
    return {
      orderId: order.id,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      paidAt: order.paidAt!,
      total: orderSub + tip,
      paymentMethod: order.paymentMethod,
      paymentCash: order.paymentCash,
      paymentCard: order.paymentCard,
      tip,
    };
  });

  return {
    orderCount: orders.length,
    subtotal,
    tips,
    total: subtotal + tips,
    dinheiro: payments.dinheiro,
    multibanco: payments.multibanco,
    mbway: payments.mbway,
    mistoCash: payments.mistoCash,
    mistoCard: payments.mistoCard,
    serviceDayLabel: formatPeriodLabel("day", reference),
    payments: paymentEntries,
  };
}
