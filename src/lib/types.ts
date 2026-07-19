export type OrderItemStatus =
  | "pendente"
  | "em_preparacao"
  | "pronto"
  | "entregue"
  | "cancelado";

export type TableStatus = "livre" | "ocupada" | "a_pagar" | "fechada";

export type PaymentMethod = "dinheiro" | "multibanco" | "mbway" | "misto";

export type KitchenZone = "entradas" | "pratos";

export interface MenuOption {
  id: string;
  label: string;
  default?: boolean;
}

export interface MenuOptionGroup {
  id: string;
  label: string;
  required: boolean;
  options: MenuOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  description?: string;
  ingredients: string[];
  kitchenNotes?: string;
  optionGroups?: MenuOptionGroup[];
  isAddon?: boolean;
  canBeAddon?: boolean;
  excludesFries?: boolean;
  /** Bebidas/bar — não vão para a cozinha */
  skipKitchen?: boolean;
  /** Admin pode desactivar sem apagar */
  active?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  note?: string;
}

export interface OrderItemCustomization {
  groupId: string;
  groupLabel: string;
  optionId: string;
  optionLabel: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customizations: OrderItemCustomization[];
  notes: string;
  ingredients: string[];
  kitchenNotes?: string;
  status: OrderItemStatus;
  isAddon: boolean;
  parentItemId?: string;
  /** Bebidas/bar — empregado gere, não passa pela cozinha */
  skipKitchen?: boolean;
  createdAt: string;
  sentToKitchenAt?: string;
  readyAt?: string;
}

/** O que a cozinha vê — só nome, notas e opções escolhidas pelo empregado. */
export interface KitchenTicketItem {
  id: string;
  name: string;
  quantity: number;
  notes: string;
  status: OrderItemStatus;
  sentToKitchenAt?: string;
  readyAt?: string;
  choices: string[];
  kitchenNotes?: string;
  kitchenZone?: KitchenZone;
}

export type AuditAction =
  | "item_cancel"
  | "item_remove"
  | "void_payment"
  | "transfer_table"
  | "merge_tables"
  | "guest_count_update"
  | "request_bill"
  | "reopen_round"
  | "clear_table"
  | "loyalty_redeem";

export interface AuditLogEntry {
  id: number;
  action: AuditAction;
  actor: string;
  tableNumber?: number;
  orderId?: string;
  detail: string;
  createdAt: string;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  waiterName: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  tip?: number;
  paymentCash?: number;
  paymentCard?: number;
  kitchenAlert?: string;
  kitchenAlertAt?: string;
  barAlert?: string;
  barAlertAt?: string;
}

export interface Table {
  number: number;
  status: TableStatus;
  orderId?: string;
  guestCount?: number;
  openedAt?: string;
}

export interface RestaurantState {
  tables: Table[];
  orders: Order[];
  lastUpdated: string;
}

export interface AddOrderItemPayload {
  menuItemId: string;
  quantity: number;
  customizations: OrderItemCustomization[];
  notes: string;
  parentItemId?: string;
}

export interface UpdateOrderItemPayload {
  quantity?: number;
  customizations?: OrderItemCustomization[];
  notes?: string;
}

export interface CreateOrderPayload {
  tableNumber: number;
  waiterName: string;
  guestCount?: number;
}

export interface PaymentPayload {
  paymentMethod: PaymentMethod;
  tip?: number;
  paymentCash?: number;
  paymentCard?: number;
  /** Desconto de recompensa App 56 (€). */
  loyaltyDiscount?: number;
  loyaltyMemberId?: string;
  loyaltyRewardId?: number;
}

export interface RecentPaymentEntry {
  orderId: string;
  tableNumber: number;
  waiterName: string;
  paidAt: string;
  total: number;
  paymentMethod?: PaymentMethod;
  paymentCash?: number;
  paymentCard?: number;
  tip?: number;
}

export interface DayCloseSummary {
  orderCount: number;
  subtotal: number;
  tips: number;
  total: number;
  dinheiro: number;
  multibanco: number;
  mbway: number;
  mistoCash: number;
  mistoCard: number;
  serviceDayLabel: string;
  payments: RecentPaymentEntry[];
}

export interface MenuCatalog {
  categories: MenuCategory[];
  items: MenuItem[];
  updatedAt: string;
}

export type AnalyticsPeriod = "day" | "week" | "month";

export interface AdminPaymentBreakdown {
  dinheiro: number;
  multibanco: number;
  mbway: number;
  mistoCash: number;
  mistoCard: number;
  cashInDrawer: number;
}

export interface AdminDailyRow {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface AdminHourlyRow {
  hour: number;
  label: string;
  revenue: number;
  orders: number;
}

export interface AdminComparison {
  previousRevenue: number;
  previousOrders: number;
  revenueChange: number;
  revenueChangePct: number;
  ordersChange: number;
}

export interface AdminKPIs {
  period: AnalyticsPeriod;
  startAt: string;
  endAt: string;
  periodLabel: string;
  revenue: number;
  tips: number;
  subtotal: number;
  orderCount: number;
  avgTicket: number;
  itemsSold: number;
  topItems: Array<{ name: string; quantity: number; revenue: number }>;
  byTable: Array<{ tableNumber: number; orders: number; revenue: number }>;
  byPayment: Array<{ method: PaymentMethod; count: number; amount: number }>;
  byWaiter: Array<{
    name: string;
    orders: number;
    revenue: number;
    tips: number;
    avgTicket: number;
  }>;
  payments: AdminPaymentBreakdown;
  byDay: AdminDailyRow[];
  byHour: AdminHourlyRow[];
  cancelledItems: { count: number; value: number };
  /** Cancelled value / (subtotal + cancelled value), 0–1. */
  cancelRate: number;
  /** Average minutes from order open to payment. */
  avgTableMinutes: number;
  comparison: AdminComparison;
}

export interface OrderHistoryEntry {
  id: string;
  tableNumber: number;
  waiterName: string;
  createdAt: string;
  paidAt: string;
  paymentMethod?: PaymentMethod;
  paymentCash?: number;
  paymentCard?: number;
  subtotal: number;
  tip: number;
  total: number;
  itemCount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  cancelledItems: Array<{ name: string; quantity: number; price: number }>;
}

export interface UpdateMenuItemPayload {
  name?: string;
  price?: number;
  active?: boolean;
  categoryId?: string;
  skipKitchen?: boolean;
  isAddon?: boolean;
  canBeAddon?: boolean;
  kitchenNotes?: string;
}

export interface CreateMenuItemPayload {
  name: string;
  price: number;
  categoryId: string;
  skipKitchen?: boolean;
  isAddon?: boolean;
  kitchenNotes?: string;
}
