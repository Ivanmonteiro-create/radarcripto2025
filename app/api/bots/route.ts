import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireApiAuth } from "@/lib/server/auth";
import { getTradingMode } from "@/lib/server/env";
import { ensureInternalUser } from "@/lib/server/internalUser";
import { prisma } from "@/lib/server/prisma";
import { botCreateSchema } from "@/lib/server/schemas";
import { normalizeSymbol } from "@/lib/trading/domain";

export async function GET() {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;
  try {
    const bots = await prisma.botConfig.findMany({
      include: {
        runtime: true,
        positions: { where: { isOpen: true } },
        orders: { orderBy: { createdAt: "desc" }, take: 1 },
        logs: { orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ ok: true, bots });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireApiAuth();
  if (unauthorized) return unauthorized;
  try {
    const input = await parseJson(request, botCreateSchema);
    if (input.mode === "TESTNET" && getTradingMode() !== "TESTNET") {
      throw new ApiError(409, "TESTNET_ENVIRONMENT_DISABLED");
    }
    const user = await ensureInternalUser();
    const strategyKind = input.strategy ?? "EMA_CROSS";
    const strategy = await prisma.strategy.upsert({
      where: { kind_version: { kind: strategyKind, version: 1 } },
      create: { kind: strategyKind, name: strategyKind, version: 1, schema: {} },
      update: {},
    });
    const bot = await prisma.botConfig.create({
      data: {
        userId: user.id, strategyId: strategy.id, name: input.name, symbol: normalizeSymbol(input.symbol),
        mode: input.mode, strategyParams: { ...input.strategyParams, kind: strategyKind },
        capitalUSDT: input.capitalUSDT, maxCapitalUSDT: input.maxCapitalUSDT,
        maxOrderUSDT: input.maxOrderUSDT, maxPositions: input.maxPositions,
        maxDailyLossUSDT: input.maxDailyLossUSDT, maxDrawdownPct: input.maxDrawdownPct,
        minOrderIntervalMs: input.minOrderIntervalMs, takeProfitPct: input.takeProfitPct,
        stopLossPct: input.stopLossPct,
        runtime: { create: { status: "STOPPED", peakEquity: input.capitalUSDT, strategyState: {} } },
      },
      include: { runtime: true },
    });
    return NextResponse.json({ ok: true, bot }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
