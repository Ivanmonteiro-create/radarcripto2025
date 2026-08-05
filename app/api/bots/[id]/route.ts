import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireApiAuth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { botPatchSchema } from "@/lib/server/schemas";
import { botCreateSchema } from "@/lib/server/schemas";
import { getTradingMode } from "@/lib/server/env";
import { normalizeSymbol } from "@/lib/trading/domain";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    const bot = await prisma.botConfig.findUnique({
      where: { id },
      include: {
        runtime: true, positions: { orderBy: { updatedAt: "desc" }, take: 20 },
        orders: { orderBy: { createdAt: "desc" }, take: 100, include: { fills: true } },
        trades: { orderBy: { timestamp: "desc" }, take: 100 },
        logs: { orderBy: { createdAt: "desc" }, take: 100 },
        riskEvents: { orderBy: { createdAt: "desc" }, take: 100 },
      },
    });
    if (!bot) throw new ApiError(404, "BOT_NOT_FOUND");
    return NextResponse.json({ ok: true, bot });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    const input = await parseJson(request, botPatchSchema);
    const current = await prisma.botConfig.findUnique({ where: { id } });
    if (!current) throw new ApiError(404, "BOT_NOT_FOUND");
    if (current.status === "RUNNING") throw new ApiError(409, "PAUSE_BOT_BEFORE_EDITING");
    const currentParams = current.strategyParams as Record<string, number | string | boolean | null>;
    const mergedResult = botCreateSchema.safeParse({
      name: input.name ?? current.name,
      symbol: input.symbol ?? current.symbol,
      mode: input.mode ?? current.mode,
      strategy: input.strategy ?? String(currentParams.kind ?? "EMA_CROSS"),
      strategyParams: input.strategyParams ?? currentParams,
      capitalUSDT: input.capitalUSDT ?? Number(current.capitalUSDT),
      maxCapitalUSDT: input.maxCapitalUSDT ?? Number(current.maxCapitalUSDT),
      maxOrderUSDT: input.maxOrderUSDT ?? Number(current.maxOrderUSDT),
      maxPositions: input.maxPositions ?? current.maxPositions,
      maxDailyLossUSDT: input.maxDailyLossUSDT ?? Number(current.maxDailyLossUSDT),
      maxDrawdownPct: input.maxDrawdownPct ?? Number(current.maxDrawdownPct),
      minOrderIntervalMs: input.minOrderIntervalMs ?? current.minOrderIntervalMs,
      takeProfitPct: input.takeProfitPct ?? (current.takeProfitPct ? Number(current.takeProfitPct) : undefined),
      stopLossPct: input.stopLossPct ?? (current.stopLossPct ? Number(current.stopLossPct) : undefined),
    });
    if (!mergedResult.success) throw new ApiError(400, "INVALID_BOT_CONFIGURATION", mergedResult.error.flatten());
    if (mergedResult.data.mode === "TESTNET" && getTradingMode() !== "TESTNET") throw new ApiError(409, "TESTNET_ENVIRONMENT_DISABLED");
    const strategy = input.strategy ? await prisma.strategy.upsert({
      where: { kind_version: { kind: input.strategy, version: 1 } },
      create: { kind: input.strategy, name: input.strategy, version: 1, schema: {} }, update: {},
    }) : null;
    const bot = await prisma.botConfig.update({
      where: { id },
      data: {
        name: input.name, symbol: input.symbol ? normalizeSymbol(input.symbol) : undefined, mode: input.mode,
        strategyId: strategy?.id,
        strategyParams: input.strategyParams && input.strategy
          ? { ...input.strategyParams, kind: input.strategy }
          : input.strategyParams,
        capitalUSDT: input.capitalUSDT, maxCapitalUSDT: input.maxCapitalUSDT,
        maxOrderUSDT: input.maxOrderUSDT, maxPositions: input.maxPositions,
        maxDailyLossUSDT: input.maxDailyLossUSDT, maxDrawdownPct: input.maxDrawdownPct,
        minOrderIntervalMs: input.minOrderIntervalMs, takeProfitPct: input.takeProfitPct,
        stopLossPct: input.stopLossPct,
      },
    });
    return NextResponse.json({ ok: true, bot });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
