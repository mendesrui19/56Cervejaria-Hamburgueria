import { NextResponse } from "next/server";
import { addItemToOrder } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tableNumber: string }> }
) {
  try {
    const { tableNumber } = await params;
    const body = await request.json();
    const order = await addItemToOrder(parseInt(tableNumber, 10), body);
    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}
