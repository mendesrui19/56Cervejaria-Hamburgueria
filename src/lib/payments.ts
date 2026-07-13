import { formatPrice } from "./menu";
import type { OrderHistoryEntry, PaymentMethod, RecentPaymentEntry } from "./types";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  multibanco: "Multibanco",
  mbway: "MB Way",
  misto: "Misto",
};

type PaymentLike =
  | Pick<RecentPaymentEntry, "paymentMethod" | "paymentCash" | "paymentCard">
  | Pick<OrderHistoryEntry, "paymentMethod" | "paymentCash" | "paymentCard">;

export function formatPaymentDetail(entry: PaymentLike): string {
  if (entry.paymentMethod === "misto") {
    return `Misto · ${formatPrice(entry.paymentCash ?? 0)} + ${formatPrice(entry.paymentCard ?? 0)}`;
  }
  if (entry.paymentMethod) {
    return PAYMENT_LABELS[entry.paymentMethod];
  }
  return "—";
}
