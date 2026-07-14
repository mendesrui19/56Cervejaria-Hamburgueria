import { NextResponse } from "next/server";
import { getLoyaltyAdminStats } from "@/lib/loyalty-store";

export async function GET() {
  try {
    const stats = await getLoyaltyAdminStats();
    return NextResponse.json(stats);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 }
    );
  }
}
