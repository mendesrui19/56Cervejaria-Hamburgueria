import { NextResponse } from "next/server";
import { sendItemsToKitchen } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tableNumber: string }> }
) {
  try {
    const { tableNumber } = await params;
    const body = await request.json().catch(() => ({}));
    const order = await sendItemsToKitchen(
      parseInt(tableNumber, 10),
      body.itemIds
    );
    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}
