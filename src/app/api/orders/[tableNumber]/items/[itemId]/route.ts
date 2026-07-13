import { NextResponse } from "next/server";
import { removeOrderItem } from "@/lib/store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tableNumber: string; itemId: string }> }
) {
  try {
    const { tableNumber, itemId } = await params;
    const order = await removeOrderItem(parseInt(tableNumber, 10), itemId);
    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}
