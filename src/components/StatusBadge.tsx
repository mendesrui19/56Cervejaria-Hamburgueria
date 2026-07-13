import type { TableStatus } from "@/lib/types";

const STATUS_LABELS: Record<TableStatus, string> = {
  livre: "Livre",
  ocupada: "Ocupada",
  a_pagar: "A Pagar",
  fechada: "Fechada",
};

const STATUS_CLASSES: Record<TableStatus, string> = {
  livre: "badge-livre",
  ocupada: "badge-ocupada",
  a_pagar: "badge-pagar",
  fechada: "badge-livre",
};

export function TableStatusBadge({ status }: { status: TableStatus }) {
  return (
    <span className={STATUS_CLASSES[status]}>{STATUS_LABELS[status]}</span>
  );
}

export function ItemStatusBadge({
  status,
  size = "sm",
}: {
  status: string;
  size?: "sm" | "lg";
}) {
  const map: Record<string, string> = {
    pendente: "badge-pendente",
    em_preparacao: "badge-preparacao",
    pronto: "badge-pronto",
    entregue: "badge-livre",
    cancelado: "badge-livre",
  };

  const labels: Record<string, string> = {
    pendente: "Pendente",
    em_preparacao: "A Preparar",
    pronto: "Pronto",
    entregue: "Entregue",
    cancelado: "Cancelado",
  };

  return (
    <span
      className={`${map[status] ?? "badge-livre"} ${
        size === "lg" ? "text-sm sm:text-base px-3 py-1" : ""
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}
