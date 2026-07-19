"use client";

import { FEATURE_LOYALTY } from "@/lib/feature-flags";
import type { AuditAction, AuditLogEntry } from "@/lib/types";

const ACTION_LABELS: Record<AuditAction, string> = {
  item_cancel: "Cancelamento",
  item_remove: "Remoção",
  void_payment: "Anulação pagamento",
  transfer_table: "Transferência",
  merge_tables: "Juntar mesas",
  guest_count_update: "Nº pessoas",
  request_bill: "Pedir conta",
  reopen_round: "Nova ronda",
  clear_table: "Fechar mesa",
  add_table: "Nova mesa",
  loyalty_redeem: "App 56",
};

const ACTION_COLORS: Record<AuditAction, string> = {
  item_cancel: "bg-red-100 text-red-800 border-red-200",
  item_remove: "bg-orange-100 text-orange-800 border-orange-200",
  void_payment: "bg-purple-100 text-purple-800 border-purple-200",
  transfer_table: "bg-blue-100 text-blue-800 border-blue-200",
  merge_tables: "bg-blue-100 text-blue-800 border-blue-200",
  guest_count_update: "bg-emerald-100 text-emerald-800 border-emerald-200",
  request_bill: "bg-amber-100 text-amber-900 border-amber-200",
  reopen_round: "bg-sky-100 text-sky-900 border-sky-200",
  clear_table: "bg-stone-100 text-stone-800 border-stone-200",
  add_table: "bg-emerald-100 text-emerald-900 border-emerald-200",
  loyalty_redeem: "bg-teal-100 text-teal-800 border-teal-200",
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminAuditLog({ logs }: { logs: AuditLogEntry[] }) {
  const visibleLogs = FEATURE_LOYALTY
    ? logs
    : logs.filter((entry) => entry.action !== "loyalty_redeem");

  if (visibleLogs.length === 0) {
    return (
      <p className="text-center text-brand-muted py-16">
        Sem registos de auditoria ainda
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {visibleLogs.map((entry) => (
        <div
          key={entry.id}
          className="card flex flex-wrap items-start gap-3 py-3 px-4"
        >
          <span
            className={`text-[10px] font-black uppercase tracking-wide rounded-md px-2 py-1 border shrink-0 ${ACTION_COLORS[entry.action]}`}
          >
            {ACTION_LABELS[entry.action]}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-stone-900 font-medium leading-snug">
              {entry.detail}
            </p>
            <p className="text-xs text-brand-muted mt-1">
              {entry.actor}
              {entry.tableNumber ? ` · Mesa ${entry.tableNumber}` : ""}
              {" · "}
              {formatWhen(entry.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
