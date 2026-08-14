import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireApiAuth, requireMutationAuth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { botPatchSchema } from "@/lib/server/schemas";
import { botCreateSchema } from "@/lib/server/schemas";
import { getTradingMode } from "@/lib/server/env";
import { normalizeSymbol } from "@/lib/trading/domain";
import { createRiskRuntimeReset } from "@/lib/trading/automationPolicy";

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
  const unauthorized = await requireMutationAuth(request);
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
    const resetRuntime = input.capitalUSDT !== undefined && Number(current.capitalUSDT) !== input.capitalUSDT;
    const requestedKind = input.strategy ?? String(currentParams.kind ?? "EMA_CROSS") as "EMA_CROSS" | "PERCENT_CYCLE" | "RANGE_CYCLE";
    const requestedParams = (input.strategyParams ?? currentParams) as Record<string, unknown>;
    const strategyVersion = requestedKind === "EMA_CROSS" && requestedParams.variant === "A2.1"
      ? 3
      : requestedKind === "EMA_CROSS" && requestedParams.variant === "A2" ? 2 : 1;
    const strategy = input.strategy || input.strategyParams ? await prisma.strategy.upsert({
      where: { kind_version: { kind: requestedKind, version: strategyVersion } },
      create: {
        kind: requestedKind,
        name: strategyVersion === 3 ? "EMA 9/21 A2.1" : strategyVersion === 2 ? "EMA 9/21 A2" : requestedKind,
        version: strategyVersion,
        schema: strategyVersion === 3
          ? { baseline: "EMA 9/21 original", parent: "A2", variant: "A2.1" }
          : strategyVersion === 2 ? { baseline: "EMA 9/21 original", variant: "A2" } : {},
      }, update: {},
    }) : null;
    const bot = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${id})) IS NULL AS locked`;
      const lockedCurrent = await tx.botConfig.findUnique({ where: { id } });
      if (!lockedCurrent) throw new ApiError(404, "BOT_NOT_FOUND");
      if (lockedCurrent.status === "RUNNING") throw new ApiError(409, "PAUSE_BOT_BEFORE_EDITING");
      if (resetRuntime) {
        const [openPositions, pendingOrders] = await Promise.all([
          tx.position.count({ where: { botId: id, isOpen: true } }),
          tx.order.count({ where: { botId: id, status: { in: ["PENDING", "UNKNOWN", "OPEN", "PARTIALLY_FILLED"] } } }),
        ]);
        if (openPositions > 0 || pendingOrders > 0) throw new ApiError(409, "RUNTIME_RESET_REQUIRES_FLAT_BOT");
      }
      const updated = await tx.botConfig.update({
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
      if (resetRuntime) {
        const runtimeReset = createRiskRuntimeReset(mergedResult.data.capitalUSDT);
        await tx.botRuntime.upsert({
          where: { botId: id },
          create: { botId: id, status: lockedCurrent.status, ...runtimeReset },
          update: runtimeReset,
        });
        await tx.botLog.create({
          data: { botId: id, level: "INFO", event: "RISK_RUNTIME_RESET", message: `Risk runtime reset for ${mergedResult.data.capitalUSDT} USDT capital` },
        });
      }
      const configuredParams = (input.strategyParams ?? current.strategyParams) as Record<string, unknown>;
      if (configuredParams.kind === "EMA_CROSS" || input.strategy === "EMA_CROSS") {
        const samplingIntervalMs = Number(configuredParams.samplingIntervalMs ?? 5_000);
        await tx.botLog.create({ data: {
          botId: id,
          level: "WARN",
          event: "EMA_TICKER_SAMPLING_CONFIGURED",
          message: `EMA configured with ticker snapshots every ${samplingIntervalMs} ms; this is not a candle timeframe`,
          metadata: { priceSource: "TICKER", samplingIntervalMs, candleTimeframe: null },
        } });
      }
      return updated;
    });
    return NextResponse.json({ ok: true, bot });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
