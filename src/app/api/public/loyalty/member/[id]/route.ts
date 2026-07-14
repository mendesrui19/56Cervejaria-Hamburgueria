import { NextResponse } from "next/server";
import { getLoyaltyMemberById } from "@/lib/loyalty-store";
import {
  getLoyaltyMemberIdFromRequest,
  loyaltySessionUnauthorized,
} from "@/lib/loyalty-session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = await getLoyaltyMemberIdFromRequest(request);
    if (!sessionId || sessionId !== id) {
      return loyaltySessionUnauthorized();
    }

    const member = await getLoyaltyMemberById(id);
    if (!member) {
      return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 });
    }
    return NextResponse.json(member);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 }
    );
  }
}
