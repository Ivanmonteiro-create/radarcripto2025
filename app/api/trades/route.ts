// app/api/trades/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const { prisma } = await import("../../../lib/prisma"); // import dinâmico
  const trades = await prisma.trade.findMany({ orderBy: { ts: "desc" }, take: 50 });
  return NextResponse.json({ ok: true, trades });
}

export async function POST(req: Request) {
  const { prisma } = await import("../../../lib/prisma");
  const body = await req.json();
  const created = await prisma.trade.create({ data: body });
  return NextResponse.json({ ok: true, created });
}
