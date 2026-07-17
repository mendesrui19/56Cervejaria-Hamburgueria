import { NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit-log";

export async function GET() {
  try {
    const logs = await getAuditLogs(300);
    return NextResponse.json(logs);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 }
    );
  }
}
