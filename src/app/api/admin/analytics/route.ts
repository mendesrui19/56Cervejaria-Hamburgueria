import { NextResponse } from "next/server";
import { getAdminKPIs } from "@/lib/analytics";
import { parseDateParam } from "@/lib/period";
import type { AnalyticsPeriod } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "day") as AnalyticsPeriod;
  const dateParam = searchParams.get("date");

  if (!["day", "week", "month"].includes(period)) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 });
  }

  const reference = parseDateParam(dateParam);
  const kpis = await getAdminKPIs(period, reference);
  return NextResponse.json(kpis);
}
