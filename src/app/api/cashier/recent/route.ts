import { NextResponse } from "next/server";
import { getRecentPayments } from "@/lib/store";

export async function GET() {
  try {
    const payments = await getRecentPayments(8);
    return NextResponse.json(payments);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}
