import { NextResponse } from "next/server";
import { clearKitchenAlert } from "@/lib/kitchen-alerts";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    await clearKitchenAlert(orderId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}
