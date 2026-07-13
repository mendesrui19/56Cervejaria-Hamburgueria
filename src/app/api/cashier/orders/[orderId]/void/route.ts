import { NextResponse } from "next/server";
import { voidPayment } from "@/lib/store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const order = await voidPayment(orderId);
    return NextResponse.json({ order });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}
