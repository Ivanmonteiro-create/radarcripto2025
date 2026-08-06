import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/server/auth";
import { aggregateHealth } from "@/lib/server/health";

export async function GET(request: Request) {
  const unauthorized = await requireApiAuth(); if (unauthorized) return unauthorized;
  const symbol = new URL(request.url).searchParams.get("symbol") ?? "BTCUSDT";
  return NextResponse.json({ ok: true, health: await aggregateHealth(symbol) });
}
