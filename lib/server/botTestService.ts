import { Prisma, type BotTestRun, type StrategyKind } from "@prisma/client";
import {
  buildTestSummary,
  calculateDrawdown,
  finalStatusForReason,
  resolveTestWindow,
  testAcceptsNewEntries,
  type TestSignal,
} from "@/lib/trading/timedTest";
import { ApiError } from "./api";
import { getCostModelConfig, getTradingMode } from "./env";
import { getTestnetCredentialSummary } from "./exchangeCredentials";
import { workerHealth } from "./health";
import { prisma } from "./prisma";
import { calculateStorageMetrics, calculateTestFinancialMetrics } from "@/lib/trading/testFinancialMetrics";

const pendingStatuses = ["PENDING", "UNKNOWN", "OPEN", "PARTIALLY_FILLED"] as const;
const jsonValue = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export async function startTimedBotTest(botId: string, durationMinutes: number, now = new Date()) {
  const window = resolveTestWindow(durationMinutes, now);
  const [worker, credentials] = await Promise.all([workerHealth(), getTestnetCredentialSummary()]);
  if (worker.state !== "HEALTHY") throw new ApiError(503, "WORKER_UNHEALTHY");

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${botId})) IS NULL AS locked`;
    const bot = await tx.botConfig.findUnique({ where: { id: botId }, include: { runtime: true } });
    if (!bot) throw new ApiError(404, "BOT_NOT_FOUND");
    if (bot.status !== "STOPPED" || bot.runtime?.status !== "STOPPED") {
      throw new ApiError(409, "TEST_REQUIRES_STOPPED_BOT");
    }
    const active = await tx.botTestRun.findFirst({ where: { botId, status: "IN_PROGRESS" }, select: { id: true } });
    if (active) throw new ApiError(409, "BOT_TEST_ALREADY_IN_PROGRESS");
    const [openPositions, pendingOrders, killSwitch] = await Promise.all([
      tx.position.count({ where: { botId, isOpen: true } }),
      tx.order.count({ where: { botId, status: { in: [...pendingStatuses] } } }),
      tx.systemControl.findUnique({ where: { id: "global" } }),
    ]);
    if (openPositions > 0 || pendingOrders > 0) throw new ApiError(409, "TEST_REQUIRES_FLAT_RECONCILED_BOT");
    if (killSwitch?.killSwitchActive) throw new ApiError(409, "KILL_SWITCH_ACTIVE");

    const params = bot.strategyParams as Record<string, unknown>;
    const strategy = String(params.kind ?? "EMA_CROSS") as StrategyKind;
    if (bot.mode === "TESTNET") {
      const fixedOrderUSDT = Number(params.fixedOrderUSDT);
      if (getTradingMode() !== "TESTNET") throw new ApiError(409, "TESTNET_ENVIRONMENT_DISABLED");
      if (!credentials.enabled) throw new ApiError(409, "TESTNET_CREDENTIALS_NOT_VALIDATED");
      if (!(fixedOrderUSDT > 0)
        || fixedOrderUSDT > Number(bot.maxOrderUSDT)
        || fixedOrderUSDT > Number(bot.capitalUSDT)) {
        throw new ApiError(409, "TESTNET_FIXED_ORDER_CONFIGURATION_REQUIRED");
      }
      const [otherRunning, manualProof] = await Promise.all([
        tx.botConfig.count({ where: { mode: "TESTNET", status: "RUNNING", id: { not: botId } } }),
        tx.order.findFirst({
          where: { botId, status: "FILLED", bot: { logs: { some: { event: "MANUAL_TESTNET_ORDER_AUTHORIZED" } } } },
          select: { id: true },
        }),
      ]);
      if (otherRunning > 0) throw new ApiError(409, "ONLY_ONE_TESTNET_BOT_MAY_RUN");
      if (!manualProof) throw new ApiError(409, "MANUAL_TESTNET_PROOF_REQUIRED");
      if (bot.maxPositions !== 1) throw new ApiError(409, "TESTNET_REQUIRES_ONE_POSITION_LIMIT");
    }

    const initialEquity = Number(bot.capitalUSDT) + Number(bot.runtime?.dailyRealizedPnl ?? 0);
    const costModel = getCostModelConfig();
    const configuration = {
      mode: bot.mode,
      symbol: bot.symbol,
      strategy,
      strategyParams: params,
      capitalUSDT: Number(bot.capitalUSDT),
      maxCapitalUSDT: Number(bot.maxCapitalUSDT),
      maxOrderUSDT: Number(bot.maxOrderUSDT),
      maxPositions: bot.maxPositions,
      maxDailyLossUSDT: Number(bot.maxDailyLossUSDT),
      maxDrawdownPct: Number(bot.maxDrawdownPct),
      minOrderIntervalMs: bot.minOrderIntervalMs,
      takeProfitPct: bot.takeProfitPct === null ? null : Number(bot.takeProfitPct),
      stopLossPct: bot.stopLossPct === null ? null : Number(bot.stopLossPct),
      priceSource: params.priceSource ?? null,
      samplingIntervalMs: params.samplingIntervalMs ?? null,
      candleTimeframe: params.candleTimeframe ?? null,
      strategyVariant: params.variant ?? "A",
      strategyName: params.variant === "A2.1" ? "EMA 9/21 A2.1" : params.variant === "A2" ? "EMA 9/21 A2" : strategy === "EMA_CROSS" ? "EMA 9/21 original" : strategy,
      thresholds: params.variant === "A2" ? {
        minExpectedEdgeBps: params.minExpectedEdgeBps,
        minEmaSeparationBps: params.minEmaSeparationBps,
        minRollingRangeBps: params.minRollingRangeBps,
        rollingRangeWindow: params.rollingRangeWindow,
      } : params.variant === "A2.1" ? {
        minExpectedEdgeBps: params.minExpectedEdgeBps,
        minEmaSeparationBps: params.minEmaSeparationBps,
        minRange5mBps: params.minRange5mBps,
        minRange15mBps: params.minRange15mBps,
      } : null,
      costModel,
    };
    const test = await tx.botTestRun.create({
      data: {
        botId,
        ...window,
        durationMinutes,
        configuration: jsonValue(configuration),
        mode: bot.mode,
        symbol: bot.symbol,
        strategy,
        initialEquity,
        peakEquity: initialEquity,
        currentEquity: initialEquity,
        grossPnl: 0,
        actualNetPnl: 0,
        realisticNetPnl: 0,
        simulatedNetPnl: 0,
        exchangeFeeActual: 0,
        realisticFee: 0,
        realisticSlippage: 0,
        simulatedFee: 0,
        actualSlippage: 0,
        simulatedSlippage: 0,
        costModelEnabled: costModel.enabled,
        realisticTakerFeeBps: costModel.realisticTakerFeeBps,
        realisticSlippageBps: costModel.realisticSlippageBps,
        simulatedMakerFeeBps: costModel.simulatedMakerFeeBps,
        simulatedTakerFeeBps: costModel.simulatedTakerFeeBps,
        simulatedSlippageBps: costModel.simulatedSlippageBps,
        insufficientEdgeBlocks: 0,
        insufficientRangeBlocks: 0,
        microCrossoversFiltered: 0,
        insufficientRealisticEdgeBlocks: 0,
        insufficient5mRangeBlocks: 0,
        insufficient15mRangeBlocks: 0,
      },
    });
    await tx.botConfig.update({ where: { id: botId }, data: { status: "RUNNING" } });
    await tx.botRuntime.upsert({
      where: { botId },
      create: { botId, status: "RUNNING", strategyState: {}, peakEquity: initialEquity },
      update: {
        status: "RUNNING",
        strategyState: {},
        lastPrice: null,
        lastSignal: null,
        lastSignalReason: null,
        lastError: null,
        workerHeartbeatAt: null,
        lastSuccessAt: null,
        consecutiveFailures: 0,
        nextRetryAt: null,
      },
    });
    await tx.botLog.create({
      data: {
        botId,
        level: "INFO",
        event: "AUTONOMOUS_TEST_STARTED",
        message: `Autonomous test started for ${durationMinutes} minutes`,
        metadata: { testRunId: test.id, testStartedAt: test.testStartedAt, testEndsAt: test.testEndsAt },
      },
    });
    return test;
  }, { maxWait: 5_000, timeout: 30_000 });
}

export async function activeTimedTest(botId: string): Promise<BotTestRun | null> {
  return prisma.botTestRun.findFirst({ where: { botId, status: "IN_PROGRESS" }, orderBy: { testStartedAt: "desc" } });
}

export async function requestTimedTestStop(botId: string, reason: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${botId})) IS NULL AS locked`;
    const test = await tx.botTestRun.findFirst({ where: { botId, status: "IN_PROGRESS" }, orderBy: { testStartedAt: "desc" } });
    if (!test) return null;
    await tx.botConfig.update({ where: { id: botId }, data: { status: "STOPPED" } });
    await tx.botRuntime.update({ where: { botId }, data: { status: "STOPPED" } });
    const updated = await tx.botTestRun.update({
      where: { id: test.id },
      data: { stopRequestedAt: test.stopRequestedAt ?? now, stopReason: test.stopReason ?? reason },
    });
    if (!test.stopRequestedAt) {
      await tx.botLog.create({
        data: {
          botId,
          level: reason === "DURATION_COMPLETED" ? "INFO" : "WARN",
          event: "AUTONOMOUS_TEST_STOP_REQUESTED",
          message: "Autonomous test stopped accepting new entries",
          metadata: { testRunId: test.id, reason },
        },
      });
    }
    return updated;
  }, { maxWait: 5_000, timeout: 30_000 });
}

export async function stopTimedTestInsideBotLock(test: BotTestRun, reason: string, now = new Date()) {
  if (test.stopRequestedAt) return;
  await prisma.$transaction([
    prisma.botConfig.update({ where: { id: test.botId }, data: { status: "STOPPED" } }),
    prisma.botRuntime.update({ where: { botId: test.botId }, data: { status: "STOPPED" } }),
    prisma.botTestRun.updateMany({
      where: { id: test.id, status: "IN_PROGRESS", stopRequestedAt: null },
      data: { stopRequestedAt: now, stopReason: reason },
    }),
    prisma.botLog.create({
      data: {
        botId: test.botId,
        level: reason === "DURATION_COMPLETED" ? "INFO" : "WARN",
        event: "AUTONOMOUS_TEST_STOP_REQUESTED",
        message: "Autonomous test stopped accepting new entries",
        metadata: { testRunId: test.id, reason },
      },
    }),
  ]);
}

export async function processTimedTests(now = new Date()): Promise<void> {
  const candidates = await prisma.botTestRun.findMany({
    where: {
      status: "IN_PROGRESS",
      OR: [
        { testEndsAt: { lte: now }, stopRequestedAt: null },
        { bot: { status: { in: ["STOPPED", "ERROR"] } }, stopRequestedAt: null },
      ],
    },
    select: { botId: true, testEndsAt: true, bot: { select: { status: true } } },
  });
  for (const candidate of candidates) {
    const reason = candidate.testEndsAt <= now
      ? "DURATION_COMPLETED"
      : candidate.bot.status === "ERROR" ? "BOT_ERROR" : "OPERATOR_STOPPED";
    await requestTimedTestStop(candidate.botId, reason, now);
  }
}

export async function finalizeStoppingTests(now = new Date()): Promise<void> {
  const tests = await prisma.botTestRun.findMany({
    where: { status: "IN_PROGRESS", stopRequestedAt: { not: null } },
    select: { id: true },
  });
  for (const test of tests) await finalizeTestRun(test.id, now);
}

export async function finalizeTestRun(testRunId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`test:${testRunId}`})) IS NULL AS locked`;
    const test = await tx.botTestRun.findUnique({ where: { id: testRunId } });
    if (!test || test.status !== "IN_PROGRESS" || !test.stopRequestedAt) return test;
    const pendingOrders = await tx.order.count({ where: { testRunId, status: { in: [...pendingStatuses] } } });
    if (pendingOrders > 0) return test;
    const [orders, fills, trades, risks, positions, snapshotRows] = await Promise.all([
      tx.order.findMany({ where: { testRunId }, select: { id: true, side: true, status: true, decisionReason: true, decisionTelemetry: true } }),
      tx.fill.count({ where: { testRunId } }),
      tx.trade.findMany({ where: { testRunId }, select: {
        orderId: true, side: true, realizedPnl: true, grossPnl: true, actualNetPnl: true,
        realisticNetPnl: true, simulatedNetPnl: true, exchangeFeeActual: true,
        realisticFee: true, realisticSlippage: true, simulatedFee: true,
        actualSlippage: true, simulatedSlippage: true,
        maeQuote: true, maeBps: true, mfeQuote: true, mfeBps: true,
        exitEfficiencyPct: true, profitGivebackBps: true, totalRealisticCost: true, totalSimulatedCost: true,
      }, orderBy: { timestamp: "asc" } }),
      tx.riskEvent.findMany({ where: { testRunId }, select: { allowed: true, code: true } }),
      tx.position.findMany({ where: { botId: test.botId, isOpen: true } }),
      tx.balanceSnapshot.count({ where: { testRunId } }),
    ]);
    const orderReasons = new Map(orders.map((order) => [order.id, order.decisionReason]));
    const financialMetrics = calculateTestFinancialMetrics(trades.map((trade) => ({
      orderId: trade.orderId,
      side: trade.side,
      grossPnl: trade.grossPnl === null ? null : Number(trade.grossPnl),
      actualNetPnl: trade.actualNetPnl === null ? Number(trade.realizedPnl) : Number(trade.actualNetPnl),
      realisticNetPnl: trade.realisticNetPnl === null ? Number(trade.realizedPnl) : Number(trade.realisticNetPnl),
      simulatedNetPnl: trade.simulatedNetPnl === null ? Number(trade.realizedPnl) : Number(trade.simulatedNetPnl),
      exchangeFeeActual: trade.exchangeFeeActual === null ? Number(trade.realizedPnl) * 0 : Number(trade.exchangeFeeActual),
      simulatedFee: trade.simulatedFee === null ? 0 : Number(trade.simulatedFee),
      actualSlippage: trade.actualSlippage === null ? 0 : Number(trade.actualSlippage),
      realisticFee: trade.realisticFee === null ? 0 : Number(trade.realisticFee),
      realisticSlippage: trade.realisticSlippage === null ? 0 : Number(trade.realisticSlippage),
      simulatedSlippage: trade.simulatedSlippage === null ? 0 : Number(trade.simulatedSlippage),
      decisionReason: orderReasons.get(trade.orderId),
      maeQuote: trade.maeQuote === null ? null : Number(trade.maeQuote),
      maeBps: trade.maeBps === null ? null : Number(trade.maeBps),
      mfeQuote: trade.mfeQuote === null ? null : Number(trade.mfeQuote),
      mfeBps: trade.mfeBps === null ? null : Number(trade.mfeBps),
      exitEfficiencyPct: trade.exitEfficiencyPct === null ? null : Number(trade.exitEfficiencyPct),
      profitGivebackBps: trade.profitGivebackBps === null ? null : Number(trade.profitGivebackBps),
      totalSimulatedCost: trade.totalSimulatedCost === null ? null : Number(trade.totalSimulatedCost),
      totalRealisticCost: trade.totalRealisticCost === null ? null : Number(trade.totalRealisticCost),
    })));
    const realizedPnl = trades.reduce((sum, trade) => sum + Number(trade.actualNetPnl ?? trade.realizedPnl), 0);
    const unrealizedPnl = positions.reduce((sum, position) => sum + Number(position.unrealizedPnl), 0);
    const initialEquity = Number(test.initialEquity);
    const finalEquity = initialEquity + realizedPnl + unrealizedPnl;
    const peakEquity = Math.max(Number(test.peakEquity), finalEquity);
    const currentDrawdownPct = calculateDrawdown(peakEquity, finalEquity);
    const maxDrawdownPct = Math.max(Number(test.maxDrawdownPct), currentDrawdownPct);
    const buyExecuted = orders.filter((order) => order.side === "BUY" && order.status === "FILLED").length;
    const sellExecuted = orders.filter((order) => order.side === "SELL" && order.status === "FILLED").length;
    const finalPosition = positions.map((position) => ({
      symbol: position.symbol,
      side: position.side,
      quantity: Number(position.quantity),
      averageEntryPrice: Number(position.averageEntryPrice),
      costBasisQuote: Number(position.costBasisQuote),
      realizedPnl: Number(position.realizedPnl),
      unrealizedPnl: Number(position.unrealizedPnl),
      openedAt: position.openedAt,
    }));
    const summary = buildTestSummary({
      testStartedAt: test.testStartedAt,
      completedAt: now,
      observations: test.observations,
      crossoverCount: test.crossoverCount,
      buySignals: test.buySignals,
      sellSignals: test.sellSignals,
      holdSignals: test.holdSignals,
      buyExecuted,
      buyBlocked: test.buyBlocked,
      sellExecuted,
      sellIgnored: test.sellIgnored,
      orderCount: orders.length,
      fillCount: fills,
      realizedPnl,
      unrealizedPnl,
      initialEquity,
      finalEquity,
      maxDrawdownPct,
      cooldownBlocks: test.cooldownBlocks,
      riskEventCount: risks.length,
      errorCount: test.errorCount,
      finalPosition,
      stopReason: test.stopReason ?? "OPERATOR_STOPPED",
    });
    const storage = calculateStorageMetrics(snapshotRows, summary.actualDurationMs);
    const filters = {
      buySignals: test.buySignals,
      buyExecuted,
      cooldownBlocks: risks.filter((risk) => risk.code === "ORDER_COOLDOWN").length,
      insufficientExpectedEdge: risks.filter((risk) => risk.code === "INSUFFICIENT_EXPECTED_EDGE").length,
      insufficientRealisticEdge: risks.filter((risk) => risk.code === "INSUFFICIENT_REALISTIC_EDGE").length,
      insufficient5mRange: risks.filter((risk) => risk.code === "INSUFFICIENT_5M_RANGE").length,
      insufficient15mRange: risks.filter((risk) => risk.code === "INSUFFICIENT_15M_RANGE").length,
      insufficientMarketRange: risks.filter((risk) => risk.code === "INSUFFICIENT_MARKET_RANGE").length,
      microCrossoversFiltered: risks.filter((risk) => risk.code === "MICRO_CROSSOVER_FILTERED").length,
      sellExecuted,
      sellIgnoredWithoutPosition: test.sellIgnored,
    };
    const a2WouldHaveBlockedExecutedBuys = orders.filter((order) => {
      if (order.side !== "BUY" || order.status !== "FILLED" || !order.decisionTelemetry || typeof order.decisionTelemetry !== "object") return false;
      return (order.decisionTelemetry as Record<string, unknown>).a2WouldBlock === true;
    }).length;
    const enrichedSummary = {
      ...summary, ...financialMetrics, filters, storage,
      comparison: { a2WouldHaveBlockedExecutedBuys },
    };
    const status = finalStatusForReason(test.stopReason ?? "OPERATOR_STOPPED");
    const updated = await tx.botTestRun.update({
      where: { id: testRunId },
      data: {
        status,
        completedAt: now,
        actualDurationMs: summary.actualDurationMs,
        finalEquity,
        realizedPnl,
        unrealizedPnl,
        finalPnl: summary.finalPnl,
        peakEquity,
        currentDrawdownPct,
        maxDrawdownPct,
        endedWithOpenPosition: positions.length > 0,
        finalPosition: jsonValue(finalPosition),
        currentEquity: finalEquity,
        grossPnl: financialMetrics.finance.grossPnl,
        actualNetPnl: financialMetrics.finance.actualNetPnl,
        realisticNetPnl: financialMetrics.finance.realisticNetPnl,
        simulatedNetPnl: financialMetrics.finance.simulatedNetPnl,
        exchangeFeeActual: financialMetrics.finance.exchangeFeeActual,
        realisticFee: financialMetrics.finance.realisticFee,
        realisticSlippage: financialMetrics.finance.realisticSlippage,
        simulatedFee: financialMetrics.finance.simulatedFee,
        actualSlippage: financialMetrics.finance.actualSlippage,
        simulatedSlippage: financialMetrics.finance.simulatedSlippage,
        summary: jsonValue(enrichedSummary),
      },
    });
    const lastSnapshot = await tx.balanceSnapshot.findFirst({
      where: { botId: test.botId }, orderBy: { timestamp: "desc" }, select: { timestamp: true },
    });
    if (lastSnapshot) {
      const balances = await tx.balanceSnapshot.findMany({ where: { botId: test.botId, timestamp: lastSnapshot.timestamp } });
      if (balances.length) await tx.balanceSnapshot.createMany({ data: balances.map((balance) => ({
        botId: balance.botId, testRunId, asset: balance.asset, free: balance.free, locked: balance.locked,
        total: balance.total, equityUSDT: balance.equityUSDT, reason: "TEST_END", timestamp: now,
      })) });
    }
    await tx.botLog.create({
      data: {
        botId: test.botId,
        level: status === "ERROR" ? "ERROR" : "INFO",
        event: "AUTONOMOUS_TEST_FINALIZED",
        message: positions.length > 0
          ? "Autonomous test finalized with an open position"
          : "Autonomous test finalized with no open position",
        metadata: { testRunId, status, stopReason: test.stopReason, endedWithOpenPosition: positions.length > 0 },
      },
    });
    return updated;
  }, { maxWait: 5_000, timeout: 30_000 });
}

export async function recordTestDecision(input: {
  test: BotTestRun;
  signal: TestSignal;
  equity: number;
  unrealizedPnl: number;
  heartbeatAt: Date;
  metadata?: Record<string, number | string | boolean | null>;
}) {
  const peakEquity = Math.max(Number(input.test.peakEquity), input.equity);
  const drawdown = calculateDrawdown(peakEquity, input.equity);
  return prisma.botTestRun.update({
    where: { id: input.test.id },
    data: {
      observations: { increment: 1 },
      crossoverCount: { increment: input.signal === "HOLD" ? 0 : 1 },
      buySignals: { increment: input.signal === "BUY" ? 1 : 0 },
      sellSignals: { increment: input.signal === "SELL" ? 1 : 0 },
      holdSignals: { increment: input.signal === "HOLD" ? 1 : 0 },
      peakEquity,
      currentEquity: input.equity,
      unrealizedPnl: input.unrealizedPnl,
      currentDrawdownPct: drawdown,
      maxDrawdownPct: Math.max(Number(input.test.maxDrawdownPct), drawdown),
      lastSignal: input.signal,
      lastHeartbeatAt: input.heartbeatAt,
      lastExpectedMoveBps: typeof input.metadata?.expectedMoveBps === "number" ? input.metadata.expectedMoveBps : undefined,
      lastRollingRangeBps: typeof input.metadata?.rollingRangeBps === "number" ? input.metadata.rollingRangeBps : undefined,
      lastEmaSeparationBps: typeof input.metadata?.emaSeparationBps === "number" ? input.metadata.emaSeparationBps : undefined,
      lastRange2mBps: typeof input.metadata?.range2mBps === "number" ? input.metadata.range2mBps : undefined,
      lastRange5mBps: typeof input.metadata?.range5mBps === "number" ? input.metadata.range5mBps : undefined,
      lastRange15mBps: typeof input.metadata?.range15mBps === "number" ? input.metadata.range15mBps : undefined,
      lastMomentum2mBps: typeof input.metadata?.momentum2mBps === "number" ? input.metadata.momentum2mBps : undefined,
      lastMomentum5mBps: typeof input.metadata?.momentum5mBps === "number" ? input.metadata.momentum5mBps : undefined,
      lastMomentum15mBps: typeof input.metadata?.momentum15mBps === "number" ? input.metadata.momentum15mBps : undefined,
      lastExpectedMoveA21Bps: typeof input.metadata?.expectedMoveBpsA21 === "number" ? input.metadata.expectedMoveBpsA21 : undefined,
    },
  });
}

export async function recordTestRiskOutcome(testRunId: string, input: {
  signal: "BUY" | "SELL";
  allowed: boolean;
  code: string;
  ignored?: boolean;
}) {
  return prisma.botTestRun.update({
    where: { id: testRunId },
    data: {
      buyBlocked: { increment: input.signal === "BUY" && !input.allowed ? 1 : 0 },
      sellIgnored: { increment: input.signal === "SELL" && input.ignored ? 1 : 0 },
      cooldownBlocks: { increment: input.code === "ORDER_COOLDOWN" ? 1 : 0 },
      insufficientEdgeBlocks: { increment: input.code === "INSUFFICIENT_EXPECTED_EDGE" ? 1 : 0 },
      insufficientRangeBlocks: { increment: input.code === "INSUFFICIENT_MARKET_RANGE" ? 1 : 0 },
      microCrossoversFiltered: { increment: input.code === "MICRO_CROSSOVER_FILTERED" ? 1 : 0 },
      insufficientRealisticEdgeBlocks: { increment: input.code === "INSUFFICIENT_REALISTIC_EDGE" ? 1 : 0 },
      insufficient5mRangeBlocks: { increment: input.code === "INSUFFICIENT_5M_RANGE" ? 1 : 0 },
      insufficient15mRangeBlocks: { increment: input.code === "INSUFFICIENT_15M_RANGE" ? 1 : 0 },
    },
  });
}

export async function recordTestRealizedPnl(testRunId: string | null | undefined, realizedPnl: number) {
  if (!testRunId || realizedPnl === 0) return;
  await prisma.botTestRun.update({ where: { id: testRunId }, data: { realizedPnl: { increment: realizedPnl } } });
}

export async function recordTestFailure(botId: string, message: string, exhausted: boolean) {
  const test = await activeTimedTest(botId);
  if (!test) return;
  await prisma.botTestRun.update({
    where: { id: test.id },
    data: {
      errorCount: { increment: 1 },
      lastError: message,
      ...(exhausted ? { stopRequestedAt: new Date(), stopReason: "BOT_ERROR" } : {}),
    },
  });
}

export function timedTestAllowsEntry(test: BotTestRun | null, now = new Date()): boolean {
  return !test || testAcceptsNewEntries(test, now);
}
