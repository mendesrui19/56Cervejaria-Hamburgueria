import type { AdminKPIs, OrderHistoryEntry, PaymentMethod } from "./types";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  multibanco: "Multibanco",
  mbway: "MB Way",
  misto: "Misto",
};

function escapeCsv(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsv(filename: string, rows: string[][]) {
  const content =
    "\uFEFF" + rows.map((row) => row.map(escapeCsv).join(";")).join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatPayment(entry: OrderHistoryEntry): string {
  if (entry.paymentMethod === "misto") {
    return `Misto (${entry.paymentCash ?? 0} + ${entry.paymentCard ?? 0})`;
  }
  return entry.paymentMethod
    ? PAYMENT_LABELS[entry.paymentMethod]
    : "—";
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function exportHistoryCsv(
  history: OrderHistoryEntry[],
  periodLabel: string
) {
  const rows: string[][] = [
    [
      "Data",
      "Hora",
      "Mesa",
      "Empregado",
      "Pagamento",
      "Subtotal",
      "Gorjeta",
      "Total",
      "Itens",
      "Cancelados",
    ],
  ];

  for (const entry of history) {
    const paid = new Date(entry.paidAt);
    const itemsText = entry.items
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(" | ");
    const cancelledText = entry.cancelledItems
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(" | ");

    rows.push([
      paid.toLocaleDateString("pt-PT"),
      paid.toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      String(entry.tableNumber),
      entry.waiterName,
      formatPayment(entry),
      entry.subtotal.toFixed(2),
      entry.tip.toFixed(2),
      entry.total.toFixed(2),
      itemsText,
      cancelledText,
    ]);
  }

  downloadCsv(`historico-${slugify(periodLabel)}.csv`, rows);
}

export function exportKpisCsv(kpis: AdminKPIs) {
  const rows: string[][] = [
    ["Relatório", kpis.periodLabel],
    ["Faturação", kpis.revenue.toFixed(2)],
    ["Subtotal", kpis.subtotal.toFixed(2)],
    ["Gorjetas", kpis.tips.toFixed(2)],
    ["Contas", String(kpis.orderCount)],
    ["Ticket médio", kpis.avgTicket.toFixed(2)],
    ["Itens vendidos", String(kpis.itemsSold)],
    [],
    ["Pagamentos", "Valor"],
    ["Dinheiro", kpis.payments.dinheiro.toFixed(2)],
    ["Multibanco", kpis.payments.multibanco.toFixed(2)],
    ["MB Way", kpis.payments.mbway.toFixed(2)],
    ["Misto (dinheiro)", kpis.payments.mistoCash.toFixed(2)],
    ["Misto (cartão)", kpis.payments.mistoCard.toFixed(2)],
    ["Na gaveta", kpis.payments.cashInDrawer.toFixed(2)],
    [],
    ["Itens cancelados (qty)", String(kpis.cancelledItems.count)],
    ["Valor cancelado", kpis.cancelledItems.value.toFixed(2)],
    [],
    ["Top produtos", "Qty", "Receita"],
  ];

  for (const item of kpis.topItems) {
    rows.push([item.name, String(item.quantity), item.revenue.toFixed(2)]);
  }

  rows.push([], ["Por empregado", "Contas", "Receita"]);
  for (const row of kpis.byWaiter) {
    rows.push([row.name, String(row.orders), row.revenue.toFixed(2)]);
  }

  if (kpis.byDay.length > 0) {
    rows.push([], ["Por dia", "Contas", "Receita"]);
    for (const row of kpis.byDay) {
      rows.push([row.label, String(row.orders), row.revenue.toFixed(2)]);
    }
  }

  downloadCsv(`relatorio-${slugify(kpis.periodLabel)}.csv`, rows);
}
