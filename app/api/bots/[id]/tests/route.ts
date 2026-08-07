import { NextResponse } from "next/server";
import { apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireApiAuth, requireMutationAuth } from "@/lib/server/auth";
import { startTimedBotTest } from "@/lib/server/botTestService";
import { prisma } from "@/lib/server/prisma";
import { botTestStartSchema } from "@/lib/server/schemas";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    const tests = await prisma.botTestRun.findMany({
      where: { botId: id },
      include: {
        orders: { select: { side: true, status: true } },
        _count: { select: { orders: true, fills: true, riskEvents: true } },
      },
      orderBy: { testStartedAt: "desc" },
      take: 30,
    });
    return NextResponse.json({
      ok: true,
      tests: tests.map((test) => ({
        ...test,
        buyExecuted: test.orders.filter((order) => order.side === "BUY" && order.status === "FILLED").length,
        sellExecuted: test.orders.filter((order) => order.side === "SELL" && order.status === "FILLED").length,
        orderCount: test._count.orders,
        fillCount: test._count.fills,
        riskEventCount: test._count.riskEvents,
        orders: undefined,
        _count: undefined,
      })),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request, context: Context) {
  const unauthorized = await requireMutationAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    const input = await parseJson(request, botTestStartSchema);
    const test = await startTimedBotTest(id, input.durationMinutes);
    return NextResponse.json({ ok: true, test }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
