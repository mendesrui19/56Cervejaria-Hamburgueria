import { NextResponse } from "next/server";
import { getLoyaltyMemberById } from "@/lib/loyalty-store";
import { getLoyaltyMemberIdFromRequest } from "@/lib/loyalty-session";

export async function GET(request: Request) {
  try {
    const memberId = await getLoyaltyMemberIdFromRequest(request);
    if (!memberId) {
      return NextResponse.json({ member: null });
    }

    const member = await getLoyaltyMemberById(memberId);
    return NextResponse.json({ member: member ?? null });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 }
    );
  }
}
