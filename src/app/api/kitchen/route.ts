import { NextResponse } from "next/server";
import { getKitchenOrders } from "@/lib/store";

export async function GET() {
  const orders = await getKitchenOrders();
  return NextResponse.json(orders);
}
