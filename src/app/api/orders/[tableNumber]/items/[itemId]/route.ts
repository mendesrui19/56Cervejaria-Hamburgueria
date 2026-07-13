import { NextResponse } from "next/server";
import {
  cancelOrderItem,
  removeOrderItem,
  updateOrderItemInOrder,
} from "@/lib/store";
import type { UpdateOrderItemPayload } from "@/lib/types";

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tableNumber: string; itemId: string }> }
) {
  try {
    const { tableNumber, itemId } = await params;
    const body = (await request.json()) as UpdateOrderItemPayload & {
      cancel?: boolean;
    };

    if (body.cancel) {
      const order = await cancelOrderItem(parseInt(tableNumber, 10), itemId);
      return NextResponse.json(order);
    }

    const order = await updateOrderItemInOrder(
      parseInt(tableNumber, 10),
      itemId,
      body
    );
    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 400 }
    );
  }
}
