import { NextResponse } from "next/server";
import { getBarOrders } from "@/lib/store";

export async function GET() {
  const orders = await getBarOrders();
  return NextResponse.json(orders);
}
