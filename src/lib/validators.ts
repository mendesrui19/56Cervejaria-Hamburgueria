import type { OrderItemStatus, PaymentMethod } from "./types";

export const TABLE_COUNT = 21;
/** Mesa virtual para pedidos de balcão / takeaway. */
export const BALCAO_TABLE_NUMBER = 21;

const PAYMENT_METHODS: PaymentMethod[] = [
  "dinheiro",
  "multibanco",
  "mbway",
  "misto",
];

const KITCHEN_TRANSITIONS: Partial<
  Record<OrderItemStatus, OrderItemStatus[]>
> = {
  em_preparacao: ["pronto"],
  pronto: ["entregue", "em_preparacao"],
};

/** Bebidas (bar/caixa): entram logo na fila e podem avançar a partir de pendente. */
const BAR_TRANSITIONS: Partial<Record<OrderItemStatus, OrderItemStatus[]>> = {
  pendente: ["em_preparacao", "pronto"],
  em_preparacao: ["pronto"],
  pronto: ["entregue", "em_preparacao"],
};

export function assertTableNumber(tableNumber: number): number {
  if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > TABLE_COUNT) {
    throw new Error(`Mesa inválida (1–${TABLE_COUNT})`);
  }
  return tableNumber;
}

export function parseTableNumber(raw: string): number {
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error("Número de mesa inválido");
  }
  return assertTableNumber(parsed);
}

export function assertPaymentMethod(method: unknown): PaymentMethod {
  if (
    typeof method !== "string" ||
    !PAYMENT_METHODS.includes(method as PaymentMethod)
  ) {
    throw new Error("Método de pagamento inválido");
  }
  return method as PaymentMethod;
}

export function normalizeTip(tip: unknown): number {
  const value = typeof tip === "number" ? tip : 0;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Gorjeta inválida");
  }
  return Math.round(value * 100) / 100;
}

export function normalizeMoney(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error("Valor inválido");
  }
  return Math.round(num * 100) / 100;
}

export function assertMistoSplit(
  total: number,
  cash: unknown,
  card: unknown
): { cash: number; card: number } {
  const cashAmount = normalizeMoney(cash);
  const cardAmount = normalizeMoney(card);
  const sum = Math.round((cashAmount + cardAmount) * 100) / 100;
  const expected = Math.round(total * 100) / 100;

  if (Math.abs(sum - expected) > 0.02) {
    throw new Error(
      `Misto: dinheiro + cartão (${sum.toFixed(2)}€) deve igualar o total (${expected.toFixed(2)}€)`
    );
  }

  if (cashAmount <= 0 && cardAmount <= 0) {
    throw new Error("Indique valores em dinheiro e/ou cartão");
  }

  return { cash: cashAmount, card: cardAmount };
}

export function assertKitchenStatusTransition(
  current: OrderItemStatus,
  next: OrderItemStatus,
  options?: { bar?: boolean }
): void {
  const allowed = (options?.bar ? BAR_TRANSITIONS : KITCHEN_TRANSITIONS)[
    current
  ];
  if (!allowed?.includes(next)) {
    throw new Error(
      `Transição inválida: ${current} → ${next}`
    );
  }
}
