import { NextResponse } from "next/server";
import { deleteCatalogItem, updateCatalogItem } from "@/lib/catalog";
import type { UpdateMenuItemPayload } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const payload = (await request.json()) as UpdateMenuItemPayload;
    const item = await updateCatalogItem(id, payload);
    return NextResponse.json(item);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao atualizar item" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await deleteCatalogItem(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao remover produto" },
      { status: 400 }
    );
  }
}
