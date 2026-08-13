import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireMutationAuth } from "@/lib/server/auth";
import { createExchange } from "@/lib/server/exchangeFactory";
import { ExecutionService } from "@/lib/server/executionService";
import { prisma } from "@/lib/server/prisma";
import { botActionSchema } from "@/lib/server/schemas";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const unauthorized = await requireMutationAuth(request);
  if (unauthorized) return unauthorized;
  try {
    await parseJson(request, botActionSchema);
    const { id } = await context.params;
    const bot = await prisma.botConfig.findUnique({ where: { id } });
    if (!bot) throw new ApiError(404, "BOT_NOT_FOUND");
    const pending = await prisma.order.findMany({ where: { botId: id, status: { in: ["PENDING", "UNKNOWN", "OPEN", "PARTIALLY_FILLED"] } } });
    const exchange = await createExchange(bot.mode, id);
    const service = new ExecutionService();
    for (const order of pending) {
      await service.reconcileOrder(order.id);
      const current = await prisma.order.findUnique({ where: { id: order.id } });
      if (current?.exchangeOrderId && ["PENDING", "UNKNOWN", "OPEN", "PARTIALLY_FILLED"].includes(current.status)) {
        await exchange.cancelOrder(current.symbol, current.exchangeOrderId);
        await service.reconcileOrder(current.id);
      }
    }
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${id})) IS NULL AS locked`;
      await tx.botConfig.update({ where: { id }, data: { status: "STOPPED" } });
      await tx.botRuntime.update({ where: { botId: id }, data: { status: "STOPPED" } });
      await tx.strategyConfig.updateMany({ where: { botId: id, status: "ACTIVE" }, data: { status: "VALIDATED" } });
      await tx.strategyLevelRuntime.updateMany({ where: { level: { strategyConfig: { botId: id } }, state: { in: ["BUY_PENDING", "SELL_PENDING"] } }, data: { state: "STOPPED", activeOrderId: null, lastTransitionAt: new Date() } });
      await tx.botLog.create({ data: { botId: id, level: "INFO", event: "STRATEGY_B_STOPPED", message: "Strategy B stopped; pending Testnet orders were reconciled and cancelled" } });
    });
    return NextResponse.json({ ok: true, status: "STOPPED" });
  } catch (error) { return apiErrorResponse(error); }
}
