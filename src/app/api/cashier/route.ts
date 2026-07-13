import { NextResponse } from "next/server";
import { getCashierTables } from "@/lib/store";

export async function GET() {
  const tables = await getCashierTables();
  return NextResponse.json(tables);
}
