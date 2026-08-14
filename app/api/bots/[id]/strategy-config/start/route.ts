import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireMutationAuth } from "@/lib/server/auth";
import { getTradingMode } from "@/lib/server/env";
import { getTestnetCredentialSummary } from "@/lib/server/exchangeCredentials";
import { workerHealth } from "@/lib/server/health";
import { prisma } from "@/lib/server/prisma";
import { rangeStrategyStartSchema } from "@/lib/server/schemas";

type Context = { params: Promise<{ id: string }> };
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export async function POST(request: Request, context: Context) {
  const unauthorized = await requireMutationAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    const input = await parseJson(request, rangeStrategyStartSchema);
    if (getTradingMode() !== "TESTNET") throw new ApiError(409, "TESTNET_ENVIRONMENT_DISABLED");
    const [bot, config, control, credentials, worker, openPositions, pendingOrders] = await Promise.all([
      prisma.botConfig.findUnique({ where: { id } }),
      prisma.strategyConfig.findUnique({ where: { id: input.configurationId }, include: { levels: true } }),
      prisma.systemControl.findUnique({ where: { id: "global" } }), getTestnetCredentialSummary(), workerHealth(),
      prisma.position.count({ where: { botId: id, isOpen: true } }),
      prisma.order.count({ where: { botId: id, status: { in: ["PENDING", "UNKNOWN", "OPEN", "PARTIALLY_FILLED"] } } }),
    ]);
    if (!bot || !config || config.botId !== id || !config.isCurrent) throw new ApiError(404, "CURRENT_STRATEGY_CONFIGURATION_NOT_FOUND");
    if (bot.status !== "STOPPED") throw new ApiError(409, "BOT_MUST_BE_STOPPED_BEFORE_START");
    if (bot.mode !== "TESTNET" || config.status !== "VALIDATED") throw new ApiError(409, "VALIDATED_TESTNET_CONFIGURATION_REQUIRED");
    if (control?.killSwitchActive) throw new ApiError(409, "KILL_SWITCH_ACTIVE");
    if (!credentials.enabled) throw new ApiError(409, "TESTNET_CREDENTIALS_NOT_VALIDATED");
    if (worker.state !== "HEALTHY") throw new ApiError(503, "WORKER_UNHEALTHY");
    if (openPositions || pendingOrders) throw new ApiError(409, "STRATEGY_START_REQUIRES_ZERO_EXPOSURE");
    const strategy = await prisma.strategy.upsert({ where: { kind_version: { kind: "RANGE_CYCLE", version: 1 } }, create: { kind: "RANGE_CYCLE", version: 1, name: "Range / Ciclo de Preço B", schema: { execution: "LIMIT", modes: ["READY", "CUSTOM"], maxLevels: 10 } }, update: {} });
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${id})) IS NULL AS locked`;
      const current = await tx.botConfig.findUnique({ where: { id } });
      if (current?.status !== "STOPPED") throw new ApiError(409, "BOT_STATE_CHANGED");
      await tx.strategyConfig.update({ where: { id: config.id }, data: { status: "ACTIVE", activatedAt: new Date() } });
      await tx.botConfig.update({ where: { id }, data: {
        strategyId: strategy.id, symbol: config.symbol, status: "RUNNING",
        capitalUSDT: config.capitalTotal, maxCapitalUSDT: config.capitalTotal, maxOrderUSDT: Math.max(...config.levels.map((level) => Number(level.quoteAmount))),
        strategyParams: json({ kind: "RANGE_CYCLE", configurationId: config.id, mode: config.mode, structuralStop: Number(config.structuralStop), orderType: "LIMIT" }),
      } });
      await tx.botRuntime.upsert({ where: { botId: id }, create: { botId: id, status: "RUNNING", peakEquity: config.capitalTotal, strategyState: {} }, update: { status: "RUNNING", lastError: null, strategyState: {} } });
      await tx.auditEvent.create({ data: { actor: "internal-operator", event: "STRATEGY_B_EXPLICITLY_AUTHORIZED", metadata: json({ botId: id, configurationId: config.id, version: config.version }) } });
    });
    return NextResponse.json({ ok: true, status: "RUNNING" });
  } catch (error) { return apiErrorResponse(error); }
}
