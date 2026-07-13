export type KitchenZone = "entradas" | "pratos";

const ENTRADAS_CATEGORIES = new Set(["apetite"]);

const PRATOS_CATEGORIES = new Set([
  "hamburguer",
  "snacks",
  "batata-especial",
  "sobremesas",
  "acompanhamentos",
]);

export function getKitchenZone(categoryId: string): KitchenZone | null {
  if (ENTRADAS_CATEGORIES.has(categoryId)) return "entradas";
  if (PRATOS_CATEGORIES.has(categoryId)) return "pratos";
  return null;
}

export function getKitchenZoneLabel(zone: KitchenZone): string {
  return zone === "entradas" ? "Entradas" : "Pratos";
}

export function kitchenAlertTag(zone: KitchenZone): string {
  return `[${getKitchenZoneLabel(zone)}]`;
}

export function kitchenAlertMatchesZone(
  message: string | undefined,
  zone: KitchenZone
): boolean {
  if (!message) return false;
  return message.includes(kitchenAlertTag(zone));
}

export function itemMatchesKitchenZone(
  itemZone: KitchenZone | undefined,
  filter: KitchenZone
): boolean {
  const zone = itemZone ?? "pratos";
  return zone === filter;
}

export function sortKitchenItems<T extends { kitchenZone?: KitchenZone }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const za = a.kitchenZone === "entradas" ? 0 : 1;
    const zb = b.kitchenZone === "entradas" ? 0 : 1;
    return za - zb;
  });
}
