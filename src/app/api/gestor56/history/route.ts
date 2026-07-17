import { NextResponse } from "next/server";
import { getOrderHistory } from "@/lib/analytics";
import { parseDateParam } from "@/lib/period";
import type { AnalyticsPeriod } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "day") as AnalyticsPeriod;
  const dateParam = searchParams.get("date");
  const tableParam = searchParams.get("table");
  const tableNumber = tableParam ? Number(tableParam) : undefined;

  if (!["day", "week", "month"].includes(period)) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 });
  }

  if (tableParam && !Number.isFinite(tableNumber)) {
    return NextResponse.json({ error: "Mesa inválida" }, { status: 400 });
  }

  const reference = parseDateParam(dateParam);
  const history = await getOrderHistory(period, reference, tableNumber);
  return NextResponse.json(history);
}
