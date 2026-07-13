export type OrderItemStatus =
  | "pendente"
  | "em_preparacao"
  | "pronto"
  | "entregue"
  | "cancelado";

export type TableStatus = "livre" | "ocupada" | "a_pagar" | "fechada";

export type PaymentMethod = "dinheiro" | "multibanco" | "mbway" | "misto";

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

export interface CreateOrderPayload {
  tableNumber: number;
  waiterName: string;
  guestCount?: number;
}

export interface PaymentPayload {
  paymentMethod: PaymentMethod;
  tip?: number;
}

export interface MenuCatalog {
  categories: MenuCategory[];
  items: MenuItem[];
  updatedAt: string;
}

export type AnalyticsPeriod = "day" | "week" | "month";

export interface AdminKPIs {
  period: AnalyticsPeriod;
  startAt: string;
  endAt: string;
  revenue: number;
  tips: number;
  subtotal: number;
  orderCount: number;
  avgTicket: number;
  itemsSold: number;
  topItems: Array<{ name: string; quantity: number; revenue: number }>;
  byTable: Array<{ tableNumber: number; orders: number; revenue: number }>;
  byPayment: Array<{ method: PaymentMethod; count: number; amount: number }>;
  byWaiter: Array<{ name: string; orders: number; revenue: number }>;
}

export interface OrderHistoryEntry {
  id: string;
  tableNumber: number;
  waiterName: string;
  createdAt: string;
  paidAt: string;
  paymentMethod?: PaymentMethod;
  subtotal: number;
  tip: number;
  total: number;
  itemCount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
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
