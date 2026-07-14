import { desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { auditLogs } from "@/db/schema";
import type { AuditLogEntry } from "@/lib/types";

export type AuditAction =
  | "item_cancel"
  | "item_remove"
  | "void_payment"
  | "transfer_table"
  | "merge_tables"
  | "guest_count_update";

export async function recordAuditLog(entry: {
  action: AuditAction;
  actor?: string;
  tableNumber?: number;
  orderId?: string;
  detail: string;
}): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();

  await db.insert(auditLogs).values({
    action: entry.action,
    actor: entry.actor?.trim() || "Staff",
    tableNumber: entry.tableNumber ?? null,
    orderId: entry.orderId ?? null,
    detail: entry.detail,
    createdAt: now,
  });
}

export async function getAuditLogs(limit = 200): Promise<AuditLogEntry[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    action: row.action as AuditAction,
    actor: row.actor,
    tableNumber: row.tableNumber ?? undefined,
    orderId: row.orderId ?? undefined,
    detail: row.detail,
    createdAt: row.createdAt,
  }));
}
