import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireApiAuth, requireMutationAuth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { rangeStrategyConfigSchema } from "@/lib/server/schemas";
import { findTestnetSpotSymbol } from "@/lib/server/spotSymbolCatalog";
import { validateRangeConfiguration } from "@/lib/trading/rangeCycle";

type Context = { params: Promise<{ id: string }> };
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const serializable = (value: unknown) => JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item));

export async function GET(_request: Request, context: Context) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    const configurations = await prisma.strategyConfig.findMany({
      where: { botId: id }, include: { levels: { include: { runtime: true }, orderBy: { levelNumber: "asc" } }, cycles: { orderBy: { createdAt: "desc" }, take: 50, include: { orders: true } } },
      orderBy: { version: "desc" }, take: 20,
    });
    return NextResponse.json({ ok: true, configurations: serializable(configurations) });
  } catch (error) { return apiErrorResponse(error); }
}

export async function POST(request: Request, context: Context) {
  const unauthorized = await requireMutationAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    const input = await parseJson(request, rangeStrategyConfigSchema);
    const bot = await prisma.botConfig.findUnique({ where: { id }, select: { id: true, userId: true, status: true, mode: true } });
    if (!bot) throw new ApiError(404, "BOT_NOT_FOUND");
    if (bot.status === "RUNNING") throw new ApiError(409, "STOP_BOT_BEFORE_CONFIGURATION_CHANGE");
    if (bot.mode !== "TESTNET") throw new ApiError(409, "STRATEGY_B_REQUIRES_TESTNET_BOT");
    const symbol = await findTestnetSpotSymbol(input.symbol);
    if (!symbol) throw new ApiError(400, "SYMBOL_NOT_FOUND_ON_BINANCE_SPOT_TESTNET");
    const validation = validateRangeConfiguration(input, symbol);
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${id})) IS NULL AS locked`;
      const lockedBot = await tx.botConfig.findUnique({ where: { id }, select: { status: true } });
      if (lockedBot?.status === "RUNNING") throw new ApiError(409, "STOP_BOT_BEFORE_CONFIGURATION_CHANGE");
      const previous = await tx.strategyConfig.findFirst({ where: { botId: id }, orderBy: { version: "desc" }, select: { version: true } });
      await tx.strategyConfig.updateMany({ where: { botId: id, isCurrent: true }, data: { isCurrent: false, status: "ARCHIVED", archivedAt: new Date() } });
      const configuration = await tx.strategyConfig.create({ data: {
        botId: id, ownerUserId: bot.userId, version: (previous?.version ?? 0) + 1, mode: input.mode,
        status: validation.valid ? "VALIDATED" : "DRAFT", name: input.name, symbol: input.symbol,
        capitalTotal: input.capitalTotal, maxCommitted: input.maxCommitted, maxExposure: input.maxExposure,
        structuralStop: input.structuralStop, simulatedMakerFeeBps: input.simulatedMakerFeeBps,
        simulatedSlippageBps: input.simulatedSlippageBps, costWarningAccepted: input.costWarningAccepted,
        validationSnapshot: json({ symbol, validation }), validatedAt: validation.valid ? new Date() : null,
        levels: { create: input.levels.map((level) => ({ ...level, runtime: { create: {} } })) },
      }, include: { levels: { include: { runtime: true }, orderBy: { levelNumber: "asc" } } } });
      await tx.auditEvent.create({ data: { actor: `user:${bot.userId}`, event: "STRATEGY_CONFIG_VERSION_CREATED", metadata: json({ botId: id, configurationId: configuration.id, version: configuration.version, mode: input.mode, valid: validation.valid }) } });
      return configuration;
    });
    return NextResponse.json({ ok: true, configuration: result, validation }, { status: 201 });
  } catch (error) { return apiErrorResponse(error); }
}
