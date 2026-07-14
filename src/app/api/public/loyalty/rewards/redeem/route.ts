import { NextResponse } from "next/server";
import { redeemLoyaltyReward } from "@/lib/loyalty-store";
import {
  getLoyaltyMemberIdFromRequest,
  loyaltySessionUnauthorized,
} from "@/lib/loyalty-session";

export async function POST(request: Request) {
  try {
    const memberId = await getLoyaltyMemberIdFromRequest(request);
    if (!memberId) return loyaltySessionUnauthorized();

    const body = (await request.json()) as { rewardId?: number };
    if (!body.rewardId) {
      return NextResponse.json({ error: "rewardId obrigatório" }, { status: 400 });
    }

    const updated = await redeemLoyaltyReward(memberId, body.rewardId);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}
