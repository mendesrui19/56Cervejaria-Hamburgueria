import { BALCAO_TABLE_NUMBER, TABLE_COUNT } from "@/lib/validators";

export function isBalcaoTable(tableNumber: number): boolean {
  return tableNumber === BALCAO_TABLE_NUMBER;
}

/** Rótulo curto para botões do mapa (ex: "B" no balcão). */
export function tableShortLabel(tableNumber: number): string {
  if (isBalcaoTable(tableNumber)) return "B";
  return String(tableNumber);
}

/** Rótulo completo (ex: "Balcão", "Mesa 5"). */
export function tableFullLabel(tableNumber: number): string {
  if (isBalcaoTable(tableNumber)) return "Balcão";
  return `Mesa ${tableNumber}`;
}

export function diningTableNumbers(): number[] {
  return Array.from({ length: TABLE_COUNT - 1 }, (_, i) => i + 1);
}
