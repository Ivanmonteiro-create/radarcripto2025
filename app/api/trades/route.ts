import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const trades = await prisma.trade.findMany({
    orderBy: { ts: "desc" },
    take: 20,
  });
  return NextResponse.json(trades);
}

export async function POST(req: Request) {
  const body = await req.json();
  const trade = await prisma.trade.create({
    data: {
      side: body.side,
      symbol: body.symbol,
      price: body.price,
      sizeUSDT: body.sizeUSDT,
      pnl: body.pnl ?? null,
    },
  });
  return NextResponse.json(trade);
}
