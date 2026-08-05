import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/server/api";
import { requireApiAuth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export async function GET(request: Request) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;
  try {
    const botId = new URL(request.url).searchParams.get("botId") ?? undefined;
    const trades = await prisma.trade.findMany({ where: botId ? { botId } : {}, orderBy: { timestamp: "desc" }, take: 200 });
    return NextResponse.json({ ok: true, trades });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
