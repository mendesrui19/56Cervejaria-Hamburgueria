import { NextResponse } from "next/server";
import { updateItemStatus } from "@/lib/store";
import type { OrderItemStatus } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const item = await updateItemStatus(itemId, body.status as OrderItemStatus);
    return NextResponse.json(item);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}
