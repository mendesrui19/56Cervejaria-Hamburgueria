import { NextResponse } from "next/server";
import { getDayCloseSummary } from "@/lib/analytics";

export async function GET() {
  try {
    const summary = await getDayCloseSummary();
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}
