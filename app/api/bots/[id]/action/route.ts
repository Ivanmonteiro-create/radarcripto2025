import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, parseJson } from "@/lib/server/api";
import { requireMutationAuth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { botActionSchema } from "@/lib/server/schemas";
import { getTradingMode } from "@/lib/server/env";
import { getTestnetCredentialSummary } from "@/lib/server/exchangeCredentials";
import { workerHealth } from "@/lib/server/health";

type Context = { params: Promise<{ id: string }> };
const allowedActions = new Set(["start", "pause", "stop"]);

export async function POST(request: Request, context: Context) {
  const unauthorized = await requireMutationAuth(request);
  if (unauthorized) return unauthorized;
  try {
    await parseJson(request, botActionSchema);
    const { id } = await context.params;
    const action = new URL(request.url).searchParams.get("type") ?? "";
    if (!allowedActions.has(action)) throw new ApiError(400, "INVALID_BOT_ACTION");
    const killSwitch = await prisma.systemControl.findUnique({ where: { id: "global" } });
    if (action === "start" && killSwitch?.killSwitchActive) throw new ApiError(409, "KILL_SWITCH_ACTIVE");
    const current = await prisma.botConfig.findUnique({ where: { id } });
    if (!current) throw new ApiError(404, "BOT_NOT_FOUND");
    if (action === "start" && current.mode === "TESTNET") {
      const params = current.strategyParams as Record<string, unknown>;
      const fixedOrderUSDT = Number(params.fixedOrderUSDT);
      if (!(fixedOrderUSDT > 0) || fixedOrderUSDT > Number(current.maxOrderUSDT) || fixedOrderUSDT > Number(current.capitalUSDT)) {
        throw new ApiError(409, "TESTNET_FIXED_ORDER_CONFIGURATION_REQUIRED");
      }
      if (getTradingMode() !== "TESTNET") throw new ApiError(409, "TESTNET_ENVIRONMENT_DISABLED");
      const [credentials, worker, otherRunning, manualProof] = await Promise.all([
        getTestnetCredentialSummary(),
        workerHealth(),
        prisma.botConfig.count({ where: { mode: "TESTNET", status: "RUNNING", id: { not: id } } }),
        prisma.order.findFirst({
          where: { botId: id, status: "FILLED", bot: { logs: { some: { event: "MANUAL_TESTNET_ORDER_AUTHORIZED" } } } },
          select: { id: true },
        }),
      ]);
      if (!credentials.enabled) throw new ApiError(409, "TESTNET_CREDENTIALS_NOT_VALIDATED");
      if (worker.state !== "HEALTHY") throw new ApiError(503, "WORKER_UNHEALTHY");
      if (otherRunning > 0) throw new ApiError(409, "ONLY_ONE_TESTNET_BOT_MAY_RUN");
      if (!manualProof) throw new ApiError(409, "MANUAL_TESTNET_PROOF_REQUIRED");
      if (current.maxPositions !== 1) throw new ApiError(409, "TESTNET_REQUIRES_ONE_POSITION_LIMIT");
    }
    const status = action === "start" ? "RUNNING" : action === "pause" ? "PAUSED" : "STOPPED";
    const bot = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
      const updated = await tx.botConfig.update({ where: { id }, data: { status } });
      await tx.botRuntime.upsert({
        where: { botId: id },
        create: { botId: id, status, strategyState: {} },
        update: { status, lastError: null, consecutiveFailures: 0, nextRetryAt: null },
      });
      await tx.botLog.create({ data: { botId: id, level: "INFO", event: `BOT_${status}`, message: `Bot changed to ${status} by internal API` } });
      if (action === "start" && current.strategyParams && typeof current.strategyParams === "object" && "kind" in current.strategyParams && current.strategyParams.kind === "EMA_CROSS") {
        const params = current.strategyParams as Record<string, unknown>;
        const samplingIntervalMs = Number(params.samplingIntervalMs ?? 5_000);
        await tx.botLog.create({ data: {
          botId: id,
          level: "WARN",
          event: "EMA_TICKER_SAMPLING_ACTIVE",
          message: `EMA uses ticker snapshots every ${samplingIntervalMs} ms; this is not a candle timeframe`,
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
