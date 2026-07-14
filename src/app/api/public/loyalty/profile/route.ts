import { NextResponse } from "next/server";
import { updateLoyaltyMemberProfile } from "@/lib/loyalty-store";
import {
  getLoyaltyMemberIdFromRequest,
  loyaltySessionUnauthorized,
} from "@/lib/loyalty-session";

export async function PATCH(request: Request) {
  try {
    const memberId = await getLoyaltyMemberIdFromRequest(request);
    if (!memberId) return loyaltySessionUnauthorized();

    const body = (await request.json()) as {
      name?: string;
      phone?: string;
      avatarUrl?: string | null;
      pin?: string;
      currentPin?: string;
    };

    const member = await updateLoyaltyMemberProfile(memberId, body);
    return NextResponse.json(member);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}
