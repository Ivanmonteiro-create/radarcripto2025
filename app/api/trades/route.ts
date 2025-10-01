// app/api/trades/route.ts
import { NextResponse } from "next/server";

// GET apenas retorna um array vazio por enquanto
export async function GET() {
  return NextResponse.json({ ok: true, trades: [] });
}

// POST apenas ecoa o que recebeu, sem salvar em banco
export async function POST(req: Request) {
  const data = await req.json().catch(() => ({}));
  return NextResponse.json({ ok: true, created: data });
}
