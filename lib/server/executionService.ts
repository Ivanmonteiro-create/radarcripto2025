import { randomUUID } from "node:crypto";
import { Prisma, type BotConfig as DbBotConfig, type BotRuntime as DbBotRuntime } from "@prisma/client";
import { SimExchange } from "@/lib/exchanges/SimExchange";
import type { IExchange } from "@/lib/exchanges/IExchange";
import type { BotConfig, BotRuntime, Position, StrategySignal } from "@/lib/trading/domain";
import { EmaCrossStrategy, type EmaCrossState } from "@/lib/trading/strategies/emaCross";
import { DEFAULT_EMA_A2_THRESHOLDS, EmaCrossA2Strategy, type EmaCrossA2State } from "@/lib/trading/strategies/emaCrossA2";
import { EmaCrossA21Strategy, type EmaCrossA21State } from "@/lib/trading/strategies/emaCrossA21";
import { PercentCycleStrategy, type PercentCycleState } from "@/lib/trading/strategies/percentCycle";
import { decideRangeAction, nextLevelStateAfterFill } from "@/lib/trading/rangeCycle";
import { calculateExitEfficiency, updateLongExcursion, type LongExcursionState } from "@/lib/trading/tradeExcursions";
import { evaluateRisk } from "@/lib/trading/riskManager";
import { reconcileSpotFill } from "@/lib/trading/positionAccounting";
import { calculateExecutionCosts, type CostModelConfig } from "@/lib/trading/executionCosts";
import { balancesEqual, intervalElapsed, selectRelevantBalances, shouldPersistSnapshot } from "@/lib/trading/balanceSnapshotPolicy";
import { resolveAutomaticBuyUSDT, resolveProtectiveExit, validateAutomaticSpotPreflight } from "@/lib/trading/automationPolicy";
import { createExchange } from "./exchangeFactory";
import { getTestnetSpotPrice } from "./publicPrice";
import { prisma } from "./prisma";
import { redactSensitive } from "./redact";
import { getBalanceSnapshotConfig, getCostModelConfig, getEmaA21ThresholdConfig, getEmaA2ThresholdConfig, getWorkerConfig } from "./env";
import {
  activeTimedTest,
  recordTestDecision,
  recordTestFailure,
  recordTestRiskOutcome,
  stopTimedTestInsideBotLock,
  timedTestAllowsEntry,
} from "./botTestService";

type DbBotWithRuntime = DbBotConfig & { runtime: DbBotRuntime | null };
const jsonValue = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export class ExecutionService {
  async closePosition(botId: string): Promise<void> {
    await prisma.$transaction(async (lockTx) => {
      const rows = await lockTx.$queryRaw<Array<{ locked: boolean }>>`
        SELECT pg_advisory_xact_lock(hashtext(${botId})) IS NULL AS locked
      `;
      if (!rows.length) throw new Error("Could not acquire bot close lock");
      await this.closePositionLocked(botId);
    }, { maxWait: 5_000, timeout: 60_000 });
  }

  private async closePositionLocked(botId: string): Promise<void> {
    const record = await prisma.botConfig.findUnique({ where: { id: botId }, include: { runtime: true } });
    if (!record) throw new Error("Bot not found");
    const bot = this.mapBot(record);
    const runtime = this.mapRuntime(record);
    const dbPosition = await prisma.position.findFirst({ where: { botId, symbol: bot.symbol, isOpen: true } });
    if (!dbPosition) throw new Error("No open position to close");
    const currentPosition: Position = {
      id: dbPosition.id, symbol: dbPosition.symbol, quantity: Number(dbPosition.quantity),
      averageEntryPrice: Number(dbPosition.averageEntryPrice), side: "LONG",
      openedAt: dbPosition.openedAt.getTime(), updatedAt: dbPosition.updatedAt.getTime(),
      realizedPnl: Number(dbPosition.realizedPnl), unrealizedPnl: Number(dbPosition.unrealizedPnl),
      costBasisQuote: Number(dbPosition.costBasisQuote),
    };
    const exchange = await createExchange(bot.mode, bot.id);
    if (exchange instanceof SimExchange) await this.hydrateSimExchange(bot, exchange);
    const price = bot.mode === "SIM" ? await getTestnetSpotPrice(bot.symbol) : await exchange.getTickerPrice(bot.symbol);
    if (exchange instanceof SimExchange) exchange.setTickerPrice(bot.symbol, price);
    await this.executeSignal(
      bot,
      runtime,
      { kind: "SELL", symbol: bot.symbol, strategy: bot.strategy, reason: "Manual close position", timestamp: Date.now() },
      exchange,
      price,
      currentPosition,
      currentPosition.quantity * price,
    );
    await this.recordBalances(bot, exchange, price, { reason: "POSITION_CLOSED" });
  }

  async runActiveBots(): Promise<void> {
    const bots = await prisma.botConfig.findMany({
      where: { status: "RUNNING", OR: [{ runtime: { nextRetryAt: null } }, { runtime: { nextRetryAt: { lte: new Date() } } }] },
      select: { id: true },
    });
    for (const bot of bots) {
      try {
        await this.runBotCycle(bot.id);
      } catch (error) {
        await this.recordFailure(bot.id, error);
      }
    }
  }

  async reconcileOpenOrders(): Promise<void> {
    const orders = await prisma.order.findMany({
      where: { status: { in: ["PENDING", "UNKNOWN", "OPEN", "PARTIALLY_FILLED"] } },
      select: { id: true, reconciliationAttempts: true, lastReconciledAt: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    for (const order of orders) {
      const delayMs = Math.min(60_000, 1_000 * (2 ** Math.min(order.reconciliationAttempts, 6)));
      if (order.lastReconciledAt && Date.now() - order.lastReconciledAt.getTime() < delayMs) continue;
      await this.reconcileOrder(order.id);
    }
  }

  async reconcileOrder(orderId: string): Promise<void> {
    await prisma.$transaction(async (lockTx) => {
      const lockKey = `order:${orderId}`;
      const rows = await lockTx.$queryRaw<Array<{ locked: boolean }>>`
        SELECT pg_try_advisory_xact_lock(hashtext(${lockKey})) AS locked
      `;
      if (!rows[0]?.locked) return;
      await this.reconcileOrderLocked(orderId);
    }, { maxWait: 5_000, timeout: 60_000 });
  }

  async runBotCycle(botId: string): Promise<void> {
    await prisma.$transaction(async (lockTx) => {
      const rows = await lockTx.$queryRaw<Array<{ locked: boolean }>>`
        SELECT pg_try_advisory_xact_lock(hashtext(${botId})) AS locked
      `;
      if (!rows[0]?.locked) return;
      await this.runBotCycleLocked(botId);
    }, { maxWait: 5_000, timeout: 60_000 });
  }

  private async runBotCycleLocked(botId: string): Promise<void> {
    const record = await prisma.botConfig.findUnique({ where: { id: botId }, include: { runtime: true } });
    if (!record || record.status !== "RUNNING") return;
    const activeTest = await activeTimedTest(botId);
    if (activeTest && !timedTestAllowsEntry(activeTest)) {
      await stopTimedTestInsideBotLock(activeTest, "DURATION_COMPLETED");
      return;
    }
    const bot = this.mapBot(record);
    const runtime = this.mapRuntime(record);
    const exchange = await createExchange(bot.mode, bot.id);
    if (exchange instanceof SimExchange) await this.hydrateSimExchange(bot, exchange);
    const price = bot.mode === "SIM" ? await getTestnetSpotPrice(bot.symbol) : await exchange.getTickerPrice(bot.symbol);
    if (exchange instanceof SimExchange) exchange.setTickerPrice(bot.symbol, price);
    const dbPositions = await prisma.position.findMany({ where: { botId, isOpen: true } });
    const trackedPosition = dbPositions.find((position) => position.symbol === bot.symbol);
    if (trackedPosition) {
      const excursion = updateLongExcursion({
        entryPrice: Number(trackedPosition.averageEntryPrice), quantity: Number(trackedPosition.quantity), currentPrice: price,
        now: new Date(), previous: this.positionExcursion(trackedPosition),
      });
      await prisma.position.update({ where: { id: trackedPosition.id }, data: excursion });
      Object.assign(trackedPosition, excursion);
    }
    const positions = dbPositions.map((position): Position => ({
      id: position.id, symbol: position.symbol, quantity: Number(position.quantity),
      averageEntryPrice: Number(position.averageEntryPrice), side: "LONG",
      openedAt: position.openedAt.getTime(), updatedAt: position.updatedAt.getTime(),
      realizedPnl: Number(position.realizedPnl),
      unrealizedPnl: position.symbol === bot.symbol ? Number(position.quantity) * price - Number(position.costBasisQuote) : Number(position.unrealizedPnl),
      costBasisQuote: Number(position.costBasisQuote),
    }));
    const currentPosition = positions.find((position) => position.symbol === bot.symbol);
    if (currentPosition) {
      await prisma.position.update({ where: { id: currentPosition.id }, data: { unrealizedPnl: currentPosition.unrealizedPnl } });
    }
    const estimatedEquity = bot.capitalUSDT + runtime.dailyRealizedPnl + positions.reduce((sum, position) => sum + position.unrealizedPnl, 0);
    let signal = bot.strategy === "RANGE_CYCLE"
      ? await this.generateRangeSignal(bot, price)
      : this.generateSignal(bot, runtime, price);
    const strategySignal = signal;
    if (bot.strategy !== "RANGE_CYCLE") {
      signal = resolveProtectiveExit({
        signal, position: currentPosition, price, takeProfitPct: bot.takeProfitPct, stopLossPct: bot.stopLossPct,
      });
    }
    if (strategySignal.kind === "SELL" && currentPosition && trackedPosition && bot.strategyParams.variant === "A2.1") {
      signal = { ...signal, metadata: {
        ...signal.metadata,
        ...this.emaSellTelemetry(currentPosition, trackedPosition, price),
      } };
    }

    const filterCode = typeof strategySignal.metadata?.filterCode === "string" ? strategySignal.metadata.filterCode : null;
    const filteredSignalKind = strategySignal.metadata?.filteredSignalKind === "BUY" || strategySignal.metadata?.filteredSignalKind === "SELL"
      ? strategySignal.metadata.filteredSignalKind
      : null;
    if (filterCode && filteredSignalKind) {
      await prisma.riskEvent.create({
        data: {
          botId, testRunId: activeTest?.id, allowed: false, code: filterCode,
          reason: strategySignal.reason, signal: jsonValue(strategySignal),
        },
      });
      if (activeTest) await recordTestRiskOutcome(activeTest.id, { signal: filteredSignalKind, allowed: false, code: filterCode });
    }

    const heartbeatAt = new Date();
    await prisma.botRuntime.upsert({
      where: { botId },
      create: {
        botId, status: "RUNNING", lastPrice: price, lastSignal: signal.kind,
        lastSignalReason: signal.reason,
        strategyState: jsonValue(runtime.strategyState), workerHeartbeatAt: heartbeatAt, peakEquity: Math.max(runtime.peakEquity, estimatedEquity),
        consecutiveFailures: 0, nextRetryAt: null, lastSuccessAt: heartbeatAt,
      },
      update: {
        status: "RUNNING", lastPrice: price, lastSignal: signal.kind,
        lastSignalReason: signal.reason, strategyState: jsonValue(runtime.strategyState),
        workerHeartbeatAt: heartbeatAt, lastError: null,
        peakEquity: Math.max(runtime.peakEquity, estimatedEquity),
        consecutiveFailures: 0, nextRetryAt: null, lastSuccessAt: heartbeatAt,
        ...(this.isSameUtcDay(runtime.dailyPnlDate, Date.now()) ? {} : { dailyRealizedPnl: 0, dailyPnlDate: new Date() }),
      },
    });
    if (activeTest) {
      const testUnrealizedPnl = positions.reduce((sum, position) => sum + position.unrealizedPnl, 0);
      const testEquity = Number(activeTest.initialEquity) + Number(activeTest.realizedPnl) + testUnrealizedPnl;
      await recordTestDecision({
        test: activeTest,
        signal: filteredSignalKind ?? signal.kind,
        equity: testEquity,
        unrealizedPnl: testUnrealizedPnl,
        heartbeatAt,
        metadata: strategySignal.metadata,
      });
    }
    await this.recordBalances(bot, exchange, price, {
      reason: activeTest?.observations === 0 ? "TEST_START" : "PERIODIC",
      testRunId: activeTest?.id,
    });
    if (signal.kind === "HOLD") return;

    if (signal.kind === "SELL" && !currentPosition) {
      if (activeTest) await recordTestRiskOutcome(activeTest.id, { signal: "SELL", allowed: false, code: "NO_OPEN_POSITION", ignored: true });
      return;
    }
    if (activeTest && !timedTestAllowsEntry(activeTest, new Date())) {
      await stopTimedTestInsideBotLock(activeTest, "DURATION_COMPLETED");
      return;
    }
    const rangeOrderValue = Number(signal.metadata?.quoteAmount ?? 0);
    const rangeQuantity = Number(signal.metadata?.quantity ?? 0);
    const requestedOrderUSDT = bot.strategy === "RANGE_CYCLE"
      ? (signal.kind === "BUY" ? rangeOrderValue : rangeQuantity * price)
      : signal.kind === "BUY" ? resolveAutomaticBuyUSDT(bot) : (currentPosition?.quantity ?? 0) * price;
    const pendingOrder = await prisma.order.findFirst({
      where: {
        botId, status: { in: ["PENDING", "UNKNOWN", "OPEN", "PARTIALLY_FILLED"] },
        ...(bot.strategy === "RANGE_CYCLE" && typeof signal.metadata?.levelId === "string"
          ? { strategyCycle: { levelId: signal.metadata.levelId } }
          : {}),
      },
      select: { id: true },
    });
    const system = await prisma.systemControl.findUnique({ where: { id: "global" } });
    const equity = estimatedEquity;
    const decision = evaluateRisk({
      bot, runtime, signal, requestedOrderUSDT, openPositions: positions, equityUSDT: equity,
      killSwitchActive: system?.killSwitchActive ?? false, hasPendingOrder: Boolean(pendingOrder),
    });
    await prisma.riskEvent.create({
      data: { botId, testRunId: activeTest?.id, allowed: decision.allowed, code: decision.code, reason: decision.reason, signal: jsonValue(signal) },
    });
    if (!decision.allowed) {
      if (activeTest) await recordTestRiskOutcome(activeTest.id, { signal: signal.kind, allowed: false, code: decision.code });
      if (["DAILY_LOSS_LIMIT", "DRAWDOWN_LIMIT", "KILL_SWITCH"].includes(decision.code)) {
        await this.recordBalances(bot, exchange, price, { reason: "CRITICAL_RISK", testRunId: activeTest?.id });
      }
      return;
    }
    if (bot.strategy === "RANGE_CYCLE" && signal.kind === "SELL" && signal.metadata?.structuralStop === true) {
      await this.cancelRangeEntryOrdersAtStructuralStop(bot, exchange);
    }
    if (bot.mode === "TESTNET") {
      const [symbolInfo, balances] = await Promise.all([
        exchange.getSymbolInfo(bot.symbol),
        exchange.getAccountBalances(),
      ]);
      const orderQuantity = bot.strategy === "RANGE_CYCLE" && rangeQuantity > 0
        ? await exchange.normalizeQuantity(bot.symbol, rangeQuantity)
        : signal.kind === "BUY"
          ? await exchange.normalizeQuantity(bot.symbol, (decision.maxOrderUSDT ?? requestedOrderUSDT) / Number(signal.metadata?.limitPrice ?? price))
          : await exchange.normalizeQuantity(bot.symbol, currentPosition!.quantity);
      validateAutomaticSpotPreflight({
        side: signal.kind,
        symbolInfo,
        marketPrice: price,
        requestedOrderUSDT: decision.maxOrderUSDT ?? requestedOrderUSDT,
        normalizedQuantity: orderQuantity,
        balances,
      });
    }
    await this.executeSignal(bot, runtime, signal, exchange, price, currentPosition, decision.maxOrderUSDT ?? requestedOrderUSDT, activeTest?.id);
  }

  private async cancelRangeEntryOrdersAtStructuralStop(bot: BotConfig, exchange: IExchange): Promise<void> {
    const pendingBuys = await prisma.order.findMany({
      where: { botId: bot.id, side: "BUY", strategyCycleId: { not: null }, status: { in: ["PENDING", "UNKNOWN", "OPEN", "PARTIALLY_FILLED"] } },
      orderBy: { createdAt: "asc" },
    });
    for (const order of pendingBuys) {
      await this.reconcileOrder(order.id);
      const current = await prisma.order.findUnique({ where: { id: order.id } });
      if (!current?.exchangeOrderId || !["PENDING", "UNKNOWN", "OPEN", "PARTIALLY_FILLED"].includes(current.status)) continue;
      await exchange.cancelOrder(current.symbol, current.exchangeOrderId);
      await this.reconcileOrder(current.id);
    }
  }

  private async generateRangeSignal(bot: BotConfig, price: number): Promise<StrategySignal> {
    const configurationId = String(bot.strategyParams.configurationId ?? "");
    const config = await prisma.strategyConfig.findFirst({
      where: { id: configurationId, botId: bot.id, isCurrent: true, status: "ACTIVE" },
      include: { levels: { where: { enabled: true }, include: { runtime: true }, orderBy: { levelNumber: "asc" } } },
    });
    if (!config) return { kind: "HOLD", symbol: bot.symbol, strategy: "RANGE_CYCLE", reason: "No active validated Strategy B configuration", timestamp: Date.now() };
    const committed = config.levels.reduce((sum, level) => sum + Number(level.runtime?.committedQuote ?? 0), 0);
    const decision = decideRangeAction(price, Number(config.structuralStop), config.levels.map((level) => ({
      id: level.id, levelNumber: level.levelNumber,
      state: level.runtime?.state ?? "WAITING_BUY", entryPrice: Number(level.entryPrice), targetPrice: Number(level.targetPrice),
      quoteAmount: Number(level.quoteAmount), repeat: level.repeat, heldQuantity: Number(level.runtime?.heldQuantity ?? 0),
      activeCycleId: level.runtime?.activeCycleId ?? undefined,
    })));
    if (decision.kind === "HOLD") return { kind: "HOLD", symbol: bot.symbol, strategy: "RANGE_CYCLE", reason: decision.reason, timestamp: Date.now(), metadata: { configurationId: config.id, committedQuote: committed } };
    if (decision.kind === "BUY" && committed + decision.quoteAmount > Number(config.maxExposure)) {
      return { kind: "HOLD", symbol: bot.symbol, strategy: "RANGE_CYCLE", reason: "Maximum configured exposure reached", timestamp: Date.now(), metadata: { configurationId: config.id, levelId: decision.levelId, filterCode: "CAPITAL_LIMIT", filteredSignalKind: "BUY" } };
    }
    return {
      kind: decision.kind, symbol: bot.symbol, strategy: "RANGE_CYCLE",
      reason: decision.kind === "BUY" ? `Strategy B level ${decision.levelNumber} entry` : decision.structuralStop ? `Strategy B structural stop at ${decision.limitPrice}` : `Strategy B level ${decision.levelNumber} target`,
      timestamp: Date.now(), metadata: {
        configurationId: config.id, levelId: decision.levelId, levelNumber: decision.levelNumber,
        limitPrice: decision.limitPrice, quoteAmount: decision.kind === "BUY" ? decision.quoteAmount : decision.quantity * decision.limitPrice,
        quantity: decision.kind === "SELL" ? decision.quantity : null,
        cycleId: decision.kind === "SELL" ? decision.cycleId : null,
        structuralStop: decision.kind === "SELL" ? decision.structuralStop : false,
        orderType: decision.kind === "SELL" && decision.structuralStop ? "MARKET" : "LIMIT",
      },
    };
  }

  private generateSignal(bot: BotConfig, runtime: BotRuntime, price: number): StrategySignal {
    if (bot.strategy === "EMA_CROSS") {
      if (bot.strategyParams.variant === "A2.1") {
        const costs = getCostModelConfig();
        const thresholds = getEmaA21ThresholdConfig();
        const strategy = new EmaCrossA21Strategy(bot.symbol, {
          shortPeriod: Number(bot.strategyParams.shortPeriod ?? 9),
          longPeriod: Number(bot.strategyParams.longPeriod ?? 21),
          samplingIntervalMs: Number(bot.strategyParams.samplingIntervalMs ?? 5_000),
          minExpectedEdgeBps: Number(bot.strategyParams.minExpectedEdgeBps ?? thresholds.minExpectedEdgeBps),
          minEmaSeparationBps: Number(bot.strategyParams.minEmaSeparationBps ?? thresholds.minEmaSeparationBps),
          minRange5mBps: Number(bot.strategyParams.minRange5mBps ?? thresholds.minRange5mBps),
          minRange15mBps: Number(bot.strategyParams.minRange15mBps ?? thresholds.minRange15mBps),
          realisticEntryFeeBps: costs.realisticTakerFeeBps,
          realisticExitFeeBps: costs.realisticTakerFeeBps,
          realisticEntrySlippageBps: costs.realisticSlippageBps,
          realisticExitSlippageBps: costs.realisticSlippageBps,
          stressEntryFeeBps: costs.simulatedTakerFeeBps,
          stressExitFeeBps: costs.simulatedTakerFeeBps,
          stressEntrySlippageBps: costs.simulatedSlippageBps,
          stressExitSlippageBps: costs.simulatedSlippageBps,
        });
        const previous = runtime.strategyState.emaA21 as EmaCrossA21State | undefined;
        if (previous) strategy.restore(previous);
        const signal = strategy.update(price);
        runtime.strategyState = { emaA21: strategy.snapshot() };
        return signal;
      }
      if (bot.strategyParams.variant === "A2") {
        const costs = getCostModelConfig();
        const thresholds = getEmaA2ThresholdConfig();
        const strategy = new EmaCrossA2Strategy(bot.symbol, {
          shortPeriod: Number(bot.strategyParams.shortPeriod ?? 9),
          longPeriod: Number(bot.strategyParams.longPeriod ?? 21),
          rollingRangeWindow: Number(bot.strategyParams.rollingRangeWindow ?? thresholds.rollingRangeWindow ?? DEFAULT_EMA_A2_THRESHOLDS.rollingRangeWindow),
          minExpectedEdgeBps: Number(bot.strategyParams.minExpectedEdgeBps ?? thresholds.minExpectedEdgeBps ?? DEFAULT_EMA_A2_THRESHOLDS.minExpectedEdgeBps),
          minEmaSeparationBps: Number(bot.strategyParams.minEmaSeparationBps ?? thresholds.minEmaSeparationBps ?? DEFAULT_EMA_A2_THRESHOLDS.minEmaSeparationBps),
          minRollingRangeBps: Number(bot.strategyParams.minRollingRangeBps ?? thresholds.minRollingRangeBps ?? DEFAULT_EMA_A2_THRESHOLDS.minRollingRangeBps),
          simulatedEntryFeeBps: costs.simulatedTakerFeeBps,
          simulatedExitFeeBps: costs.simulatedTakerFeeBps,
          simulatedEntrySlippageBps: costs.simulatedSlippageBps,
          simulatedExitSlippageBps: costs.simulatedSlippageBps,
        });
        const previous = runtime.strategyState.emaA2 as EmaCrossA2State | undefined;
        if (previous) strategy.restore(previous);
        const signal = strategy.update(price);
        runtime.strategyState = { emaA2: strategy.snapshot() };
        return signal;
      }
      const strategy = new EmaCrossStrategy(bot.symbol, {
        shortPeriod: Number(bot.strategyParams.shortPeriod ?? 9),
        longPeriod: Number(bot.strategyParams.longPeriod ?? 21),
      });
      const previous = runtime.strategyState.ema as EmaCrossState | undefined;
      if (previous) strategy.restore(previous);
      const signal = strategy.update(price);
      runtime.strategyState = { ema: strategy.snapshot() };
      return signal;
    }
    const strategy = new PercentCycleStrategy({
      symbol: bot.symbol, capitalUSDT: bot.capitalUSDT,
      sellRisePct: Number(bot.strategyParams.sellRisePct ?? 2),
      rebuyDropPct: Number(bot.strategyParams.rebuyDropPct ?? 1),
      optionalStopLossPct: bot.strategyParams.optionalStopLossPct === undefined ? undefined : Number(bot.strategyParams.optionalStopLossPct),
      maxCapitalUSDT: bot.maxCapitalUSDT,
    });
    const previous = runtime.strategyState.percentCycle as PercentCycleState | undefined;
    if (previous) strategy.restore(previous);
    const signal = strategy.evaluate(price);
    runtime.strategyState = { percentCycle: strategy.snapshot() };
    return signal;
  }

  private async executeSignal(
    bot: BotConfig,
    runtime: BotRuntime,
    signal: StrategySignal,
    exchange: IExchange,
    price: number,
    currentPosition: Position | undefined,
    orderValue: number,
    testRunId?: string,
  ): Promise<void> {
    if (testRunId) {
      const test = await prisma.botTestRun.findUnique({ where: { id: testRunId } });
      if (!test || !timedTestAllowsEntry(test, new Date())) {
        if (test) await stopTimedTestInsideBotLock(test, "DURATION_COMPLETED");
        return;
      }
    }
    const clientOrderId = `rc-${bot.id.slice(0, 8)}-${randomUUID().slice(0, 12)}`;
    if (signal.kind === "HOLD") return;
    const orderSide = signal.kind;
    const range = bot.strategy === "RANGE_CYCLE" && typeof signal.metadata?.levelId === "string";
    const limitPrice = Number(signal.metadata?.limitPrice ?? price);
    const quantity = range
      ? signal.kind === "SELL" ? Number(signal.metadata?.quantity) : await exchange.normalizeQuantity(bot.symbol, orderValue / limitPrice)
      : signal.kind === "SELL" ? currentPosition?.quantity : undefined;
    const orderType = range && signal.metadata?.orderType !== "MARKET" ? "LIMIT" : "MARKET";
    const pending = await prisma.$transaction(async (tx) => {
      let cycleId = range ? String(signal.metadata?.cycleId ?? "") : "";
      if (range && signal.kind === "BUY") {
        const levelId = String(signal.metadata?.levelId ?? "");
        const level = await tx.strategyLevel.findUnique({ where: { id: levelId }, include: { runtime: true, cycles: { orderBy: { cycleNumber: "desc" }, take: 1 } } });
        if (!level || level.runtime?.state !== "WAITING_BUY") throw new Error("RANGE_LEVEL_NOT_READY_FOR_BUY");
        const cycle = await tx.strategyCycle.create({ data: {
          strategyConfigId: String(signal.metadata?.configurationId), levelId, cycleNumber: (level.cycles[0]?.cycleNumber ?? 0) + 1,
          status: "BUY_PENDING", entryLimitPrice: limitPrice, targetLimitPrice: level.targetPrice, quoteAmount: level.quoteAmount,
        } });
        cycleId = cycle.id;
        await tx.strategyLevelRuntime.update({ where: { levelId }, data: { state: "BUY_PENDING", activeCycleId: cycle.id, activeOrderId: clientOrderId, committedQuote: level.quoteAmount, lastTransitionAt: new Date() } });
      } else if (range && signal.kind === "SELL") {
        await tx.strategyCycle.update({ where: { id: cycleId }, data: { status: "SELL_PENDING" } });
        await tx.strategyLevelRuntime.update({ where: { levelId: String(signal.metadata?.levelId) }, data: { state: "SELL_PENDING", activeOrderId: clientOrderId, lastTransitionAt: new Date() } });
      }
      return tx.order.create({ data: {
        botId: bot.id, testRunId, clientOrderId, symbol: bot.symbol, side: signal.kind === "BUY" ? "BUY" : "SELL",
        strategyCycleId: cycleId || undefined, type: orderType, status: "PENDING", requestedQuantity: quantity ?? orderValue / price,
        requestedPrice: orderType === "LIMIT" ? limitPrice : undefined, decisionPrice: price, decisionReason: signal.reason,
        decisionTelemetry: signal.metadata ? jsonValue(signal.metadata) : undefined,
        submittedAt: new Date(),
      } });
    });
    try {
      const result = orderType === "LIMIT"
        ? await exchange.createLimitOrder({ symbol: bot.symbol, side: orderSide, quantity: quantity!, price: limitPrice, clientOrderId })
        : await exchange.createMarketOrder({ symbol: bot.symbol, side: orderSide, quantity, quoteOrderQty: signal.kind === "BUY" ? orderValue : undefined, clientOrderId });
      if (bot.strategy === "PERCENT_CYCLE") {
        const previous = (runtime.strategyState.percentCycle as PercentCycleState | undefined) ?? { status: "WAITING_BUY" };
        runtime.strategyState = {
          percentCycle: result.order.status === "FILLED"
            ? {
                ...previous,
                status: signal.kind === "BUY" ? "HOLDING_ASSET" : "WAITING_REBUY",
                ...(signal.kind === "BUY" ? { lastBuyPrice: result.order.averageFillPrice ?? price } : { lastSellPrice: result.order.averageFillPrice ?? price }),
              }
            : { ...previous, status: signal.kind === "BUY" ? "BUY_ORDER_PENDING" : "SELL_ORDER_PENDING" },
        };
      }
      await prisma.$transaction(async (tx) => {
        const averageFillPrice = result.order.averageFillPrice ?? price;
        const executedQuantity = result.order.executedQuantity;
        const exchangeFeeActual = result.fills.reduce((sum, fill) => sum + fill.feeQuote, 0);
        const orderCosts = executedQuantity > 0 ? calculateExecutionCosts({
          side: orderSide, type: orderType, decisionPrice: price, averageFillPrice,
          quantity: executedQuantity, exchangeFeeActual, costModel: getCostModelConfig(),
        }) : null;
        await tx.order.update({
          where: { id: pending.id },
          data: {
            exchangeOrderId: result.order.exchangeOrderId ?? result.order.id,
            status: result.order.status, executedQuantity: result.order.executedQuantity,
            averageFillPrice: result.order.averageFillPrice, rejectReason: result.order.rejectReason,
            firstFillAt: result.fills.length ? new Date(Math.min(...result.fills.map((fill) => fill.timestamp))) : null,
            slippageQuote: orderCosts?.slippageQuote,
            slippageBps: orderCosts?.slippageBps,
            exchangeFeeActual: orderCosts?.exchangeFeeActual,
            realisticFee: orderCosts?.realisticFee,
            realisticSlippage: orderCosts?.realisticSlippage,
            simulatedFee: orderCosts?.simulatedFee,
            simulatedSlippage: orderCosts?.simulatedSlippage,
          },
        });
        for (const fill of bot.mode === "SIM" ? result.fills : []) {
          const dbFill = await tx.fill.create({
            data: {
              botId: bot.id, testRunId, orderId: pending.id, exchangeFillId: fill.id, symbol: fill.symbol,
              side: fill.side, price: fill.price, quantity: fill.quantity, feeQuote: fill.feeQuote,
              feeAsset: fill.feeAsset, feeAmount: fill.feeAmount ?? fill.feeQuote,
              timestamp: new Date(fill.timestamp),
            },
          });
          const costs = calculateExecutionCosts({
            side: dbFill.side, type: orderType, decisionPrice: price, averageFillPrice: Number(dbFill.price),
            quantity: Number(dbFill.quantity), exchangeFeeActual: Number(dbFill.feeQuote), costModel: getCostModelConfig(),
          });
          const accounting = await this.applyPersistedFill(
            tx, bot.id, dbFill.symbol, dbFill.side, Number(dbFill.quantity), Number(dbFill.price), Number(dbFill.feeQuote), price, costs,
          );
          await tx.trade.create({
            data: {
              botId: bot.id, testRunId, orderId: pending.id, symbol: fill.symbol, side: fill.side,
              price: fill.price, quantity: fill.quantity, notionalQuote: fill.price * fill.quantity,
              feeQuote: fill.feeQuote, realizedPnl: accounting.actualNetPnl, timestamp: new Date(fill.timestamp),
              feeAsset: fill.feeAsset, feeAmount: fill.feeAmount ?? fill.feeQuote,
              grossPnl: accounting.grossPnl, actualNetPnl: accounting.actualNetPnl,
              realisticNetPnl: accounting.realisticNetPnl,
              simulatedNetPnl: accounting.simulatedNetPnl, exchangeFeeActual: costs.exchangeFeeActual,
              realisticFee: costs.realisticFee, realisticSlippage: costs.realisticSlippage,
              simulatedFee: costs.simulatedFee, actualSlippage: costs.slippageQuote,
              simulatedSlippage: costs.simulatedSlippage,
              ...this.closedTradeTelemetry(accounting),
            },
          });
          if (accounting.actualNetPnl !== 0) {
            await tx.botRuntime.update({ where: { botId: bot.id }, data: { dailyRealizedPnl: { increment: accounting.actualNetPnl }, dailyPnlDate: new Date() } });
          }
          if (testRunId) await this.incrementTestFinancials(tx, testRunId, accounting, costs);
        }
        await tx.botRuntime.update({
          where: { botId: bot.id }, data: { lastOrderAt: new Date(), strategyState: jsonValue(runtime.strategyState) },
        });
        await tx.botLog.create({ data: { botId: bot.id, level: "INFO", event: "ORDER_RECONCILED", message: `Order ${pending.id} reconciled as ${result.order.status}` } });
      });
      if (bot.mode === "TESTNET") await this.reconcileOrder(pending.id);
      else if (result.fills.length) {
        const hasOpenPosition = await prisma.position.count({ where: { botId: bot.id, symbol: bot.symbol, isOpen: true } }) > 0;
        const reason = orderSide === "BUY"
          ? "BUY_FILLED_POSITION_OPENED"
          : hasOpenPosition ? "SELL_FILLED" : "SELL_FILLED_POSITION_CLOSED";
        await this.recordBalances(bot, exchange, price, { reason, testRunId });
      }
    } catch (error) {
      const message = redactSensitive(error instanceof Error ? error.message : "Order failed");
      await prisma.order.update({
        where: { id: pending.id },
        data: { status: "UNKNOWN", submissionUncertain: true, lastReconciliationError: message },
      });
      throw error;
    }
  }

  private async reconcileOrderLocked(orderId: string): Promise<void> {
    const local = await prisma.order.findUnique({ where: { id: orderId }, include: { bot: true, testRun: true, strategyCycle: { include: { level: true } } } });
    if (!local || local.bot.mode !== "TESTNET") return;
    try {
      const exchange = await createExchange("TESTNET", local.botId);
      const remote = await exchange.getOrder(local.symbol, local.exchangeOrderId
        ? { orderId: local.exchangeOrderId }
        : { clientOrderId: local.clientOrderId });
      const trades = (await exchange.getRecentTrades(local.symbol, 1_000))
        .filter((trade) => trade.orderId === (remote.exchangeOrderId ?? remote.id));
      const decisionPrice = Number(local.decisionPrice ?? local.requestedPrice ?? remote.averageFillPrice ?? 0);
      const averageFillPrice = remote.averageFillPrice ?? (trades.length
        ? trades.reduce((sum, trade) => sum + trade.price * trade.quantity, 0) / trades.reduce((sum, trade) => sum + trade.quantity, 0)
        : 0);
      const exchangeFeeActual = trades.reduce((sum, trade) => sum + trade.feeQuote, 0);
      const costModel = this.costModelForTest(local.testRun) ?? getCostModelConfig();
      const orderCosts = remote.executedQuantity > 0 && decisionPrice > 0 && averageFillPrice > 0
        ? calculateExecutionCosts({ side: local.side, type: local.type, decisionPrice, averageFillPrice, quantity: remote.executedQuantity, exchangeFeeActual, costModel })
        : null;
      const divergence = local.status !== remote.status || Number(local.executedQuantity) !== remote.executedQuantity;
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: local.id },
          data: {
            exchangeOrderId: remote.exchangeOrderId ?? remote.id,
            status: remote.status,
            executedQuantity: remote.executedQuantity,
            averageFillPrice: remote.averageFillPrice,
            firstFillAt: trades.length ? new Date(Math.min(...trades.map((trade) => trade.timestamp))) : local.firstFillAt,
            slippageQuote: orderCosts?.slippageQuote,
            slippageBps: orderCosts?.slippageBps,
            exchangeFeeActual: orderCosts?.exchangeFeeActual,
            realisticFee: orderCosts?.realisticFee,
            realisticSlippage: orderCosts?.realisticSlippage,
            simulatedFee: orderCosts?.simulatedFee,
            simulatedSlippage: orderCosts?.simulatedSlippage,
            submissionUncertain: false,
            reconciliationAttempts: { increment: 1 },
            lastReconciledAt: new Date(),
            lastReconciliationError: null,
            exchangeUpdatedAt: new Date(remote.updatedAt),
          },
        });
        for (const trade of trades) {
          const existing = await tx.fill.findUnique({
            where: { orderId_exchangeFillId: { orderId: local.id, exchangeFillId: trade.id } },
          });
          if (existing) continue;
          const fill = await tx.fill.create({ data: {
            botId: local.botId,
            testRunId: local.testRunId,
            orderId: local.id,
            exchangeFillId: trade.id,
            symbol: trade.symbol,
            side: trade.side,
            price: trade.price,
            quantity: trade.quantity,
            feeQuote: trade.feeQuote,
            feeAsset: trade.feeAsset,
            feeAmount: trade.feeAmount ?? trade.feeQuote,
            timestamp: new Date(trade.timestamp),
          } });
          const costs = calculateExecutionCosts({
            side: fill.side, type: local.type, decisionPrice: decisionPrice || Number(fill.price),
            averageFillPrice: Number(fill.price), quantity: Number(fill.quantity),
            exchangeFeeActual: Number(fill.feeQuote), costModel,
          });
          const accounting = await this.applyPersistedFill(
            tx, local.botId, fill.symbol, fill.side, Number(fill.quantity), Number(fill.price), Number(fill.feeQuote),
            decisionPrice || Number(fill.price), costs,
          );
          await tx.trade.create({ data: {
            botId: local.botId,
            testRunId: local.testRunId,
            orderId: local.id,
            exchangeTradeId: trade.id,
            symbol: trade.symbol,
            side: trade.side,
            price: trade.price,
            quantity: trade.quantity,
            notionalQuote: trade.notionalQuote,
            feeQuote: trade.feeQuote,
            feeAsset: trade.feeAsset,
            feeAmount: trade.feeAmount ?? trade.feeQuote,
            realizedPnl: accounting.actualNetPnl,
            grossPnl: accounting.grossPnl,
            actualNetPnl: accounting.actualNetPnl,
            realisticNetPnl: accounting.realisticNetPnl,
            simulatedNetPnl: accounting.simulatedNetPnl,
            exchangeFeeActual: costs.exchangeFeeActual,
            realisticFee: costs.realisticFee,
            realisticSlippage: costs.realisticSlippage,
            simulatedFee: costs.simulatedFee,
            actualSlippage: costs.slippageQuote,
            simulatedSlippage: costs.simulatedSlippage,
            ...this.closedTradeTelemetry(accounting),
            timestamp: new Date(trade.timestamp),
          } });
          if (accounting.actualNetPnl !== 0) {
            await tx.botRuntime.update({ where: { botId: local.botId }, data: { dailyRealizedPnl: { increment: accounting.actualNetPnl }, dailyPnlDate: new Date() } });
          }
          if (local.testRunId) await this.incrementTestFinancials(tx, local.testRunId, accounting, costs);
        }
        if (local.strategyCycle && remote.status === "FILLED") {
          const cycle = await tx.strategyCycle.findUnique({ where: { id: local.strategyCycle.id }, include: { orders: true } });
          if (cycle && local.side === "BUY") {
            const filledQuantity = remote.executedQuantity;
            await tx.strategyCycle.update({ where: { id: cycle.id }, data: {
              status: "HOLDING", filledQuantity, averageBuyPrice: averageFillPrice, openedAt: new Date(),
              fees: { increment: orderCosts?.exchangeFeeActual ?? 0 }, slippage: { increment: orderCosts?.slippageQuote ?? 0 },
            } });
            await tx.strategyLevelRuntime.update({ where: { levelId: cycle.levelId }, data: {
              state: "WAITING_SELL", heldQuantity: filledQuantity,
              committedQuote: filledQuantity * averageFillPrice, buys: { increment: 1 }, activeOrderId: null, lastTransitionAt: new Date(),
            } });
          } else if (cycle && local.side === "SELL") {
            const quantity = Math.min(remote.executedQuantity, Number(cycle.filledQuantity));
            const grossPnl = quantity * (averageFillPrice - Number(cycle.averageBuyPrice ?? cycle.entryLimitPrice));
            const addedFees = orderCosts?.exchangeFeeActual ?? 0;
            const addedSlippage = orderCosts?.slippageQuote ?? 0;
            const totalFees = Number(cycle.fees) + addedFees;
            const totalSlippage = Number(cycle.slippage) + addedSlippage;
            // Fill prices already contain execution quality. Observed slippage remains telemetry
            // and must not be subtracted a second time from the real economic result.
            const netPnl = grossPnl - totalFees;
            const holdingMs = cycle.openedAt ? Date.now() - cycle.openedAt.getTime() : 0;
            const repeat = local.strategyCycle.level.repeat;
            await tx.strategyCycle.update({ where: { id: cycle.id }, data: {
              status: "COMPLETED", averageSellPrice: averageFillPrice, grossPnl, fees: totalFees,
              slippage: totalSlippage, netPnl, stopTriggered: Boolean((local.decisionTelemetry as Record<string, unknown> | null)?.structuralStop), closedAt: new Date(),
            } });
            const levelRuntime = await tx.strategyLevelRuntime.findUnique({ where: { levelId: cycle.levelId } });
            await tx.strategyLevelRuntime.update({ where: { levelId: cycle.levelId }, data: {
              state: nextLevelStateAfterFill("SELL", repeat), activeCycleId: null, activeOrderId: null,
              heldQuantity: 0, committedQuote: 0, sells: { increment: 1 }, completedCycles: { increment: 1 },
              grossPnl: { increment: grossPnl }, fees: { increment: totalFees }, slippage: { increment: totalSlippage }, netPnl: { increment: netPnl },
              totalHoldingMs: { increment: BigInt(Math.max(0, holdingMs)) },
              bestCyclePnl: levelRuntime?.bestCyclePnl === null || levelRuntime?.bestCyclePnl === undefined ? netPnl : Math.max(Number(levelRuntime.bestCyclePnl), netPnl),
              worstCyclePnl: levelRuntime?.worstCyclePnl === null || levelRuntime?.worstCyclePnl === undefined ? netPnl : Math.min(Number(levelRuntime.worstCyclePnl), netPnl),
              stopTriggeredCount: Boolean((local.decisionTelemetry as Record<string, unknown> | null)?.structuralStop) ? { increment: 1 } : undefined,
              lastTransitionAt: new Date(),
            } });
          }
        }
        if (local.strategyCycle && ["CANCELLED", "REJECTED"].includes(remote.status)) {
          const level = local.strategyCycle.level;
          await tx.strategyCycle.update({ where: { id: local.strategyCycle.id }, data: { status: remote.status === "CANCELLED" ? "STOPPED" : "ERROR", closedAt: new Date() } });
          await tx.strategyLevelRuntime.update({ where: { levelId: level.id }, data: {
            state: local.side === "BUY" ? "WAITING_BUY" : "WAITING_SELL", activeOrderId: null,
            ...(local.side === "BUY" ? { activeCycleId: null, committedQuote: 0 } : {}), lastTransitionAt: new Date(),
          } });
        }
        await tx.botLog.create({ data: {
          botId: local.botId,
          level: divergence ? "WARN" : "INFO",
          event: divergence ? "ORDER_DIVERGENCE_RECONCILED" : "ORDER_RECONCILED",
          message: `Order ${local.id} reconciled as ${remote.status}`,
          metadata: { persistedFillCount: trades.length },
        } });
      });
      const bot = this.mapBot({ ...local.bot, runtime: null });
      const price = await exchange.getTickerPrice(local.symbol);
      if (trades.length) {
        const hasOpenPosition = await prisma.position.count({ where: { botId: local.botId, symbol: local.symbol, isOpen: true } }) > 0;
        const reason = local.side === "BUY"
          ? "BUY_FILLED_POSITION_OPENED"
          : hasOpenPosition ? "SELL_FILLED" : "SELL_FILLED_POSITION_CLOSED";
        await this.recordBalances(bot, exchange, price, { reason, testRunId: local.testRunId ?? undefined });
      }
    } catch (error) {
      const message = redactSensitive(error instanceof Error ? error.message : "Order reconciliation failed");
      await prisma.order.update({
        where: { id: orderId },
        data: { reconciliationAttempts: { increment: 1 }, lastReconciledAt: new Date(), lastReconciliationError: message },
      });
      if (local.testRunId) {
        await prisma.botTestRun.update({
          where: { id: local.testRunId },
          data: { errorCount: { increment: 1 }, lastError: message },
        });
      }
    }
  }

  private async applyPersistedFill(
    tx: Prisma.TransactionClient,
    botId: string,
    symbol: string,
    side: "BUY" | "SELL",
    quantity: number,
    price: number,
    fee: number,
    decisionPrice: number,
    costs: ReturnType<typeof calculateExecutionCosts>,
  ) {
    const position = await tx.position.findFirst({ where: { botId, symbol, isOpen: true } });
    const now = new Date();
    const excursion = position ? updateLongExcursion({
      entryPrice: Number(position.averageEntryPrice), quantity: Number(position.quantity), currentPrice: price,
      now, previous: this.positionExcursion(position),
    }) : null;
    const result = reconcileSpotFill(position ? {
      quantity: Number(position.quantity), averageEntryPrice: Number(position.averageEntryPrice),
      costBasisQuote: Number(position.costBasisQuote), realizedPnl: Number(position.realizedPnl),
      decisionCostBasisQuote: position.decisionCostBasisQuote === null ? undefined : Number(position.decisionCostBasisQuote),
      simulatedEntryFee: position.simulatedEntryFee === null ? undefined : Number(position.simulatedEntryFee),
      simulatedEntrySlippage: position.simulatedEntrySlippage === null ? undefined : Number(position.simulatedEntrySlippage),
      actualEntryFee: position.actualEntryFee === null ? undefined : Number(position.actualEntryFee),
      actualEntrySlippage: position.actualEntrySlippage === null ? undefined : Number(position.actualEntrySlippage),
      realisticEntryFee: position.realisticEntryFee === null ? undefined : Number(position.realisticEntryFee),
      realisticEntrySlippage: position.realisticEntrySlippage === null ? undefined : Number(position.realisticEntrySlippage),
    } : null, {
      side, quantity, price, feeQuote: fee, decisionPrice,
      realisticFee: costs.realisticFee, realisticSlippage: costs.realisticSlippage,
      simulatedFee: costs.simulatedFee, simulatedSlippage: costs.simulatedSlippage, actualSlippage: costs.slippageQuote,
    });
    if (!position && result.position) {
      const openedExcursion = updateLongExcursion({
        entryPrice: result.position.averageEntryPrice, quantity: result.position.quantity, currentPrice: price, now,
      });
      await tx.position.create({ data: {
        botId, symbol, quantity: result.position.quantity, averageEntryPrice: result.position.averageEntryPrice,
        costBasisQuote: result.position.costBasisQuote, realizedPnl: result.position.realizedPnl,
        decisionCostBasisQuote: result.position.decisionCostBasisQuote,
        simulatedEntryFee: result.position.simulatedEntryFee,
        simulatedEntrySlippage: result.position.simulatedEntrySlippage,
        actualEntryFee: result.position.actualEntryFee, actualEntrySlippage: result.position.actualEntrySlippage,
        realisticEntryFee: result.position.realisticEntryFee, realisticEntrySlippage: result.position.realisticEntrySlippage,
        ...openedExcursion,
        openedAt: now, side: "LONG",
      } });
    } else if (position && !result.position) {
      await tx.position.update({ where: { id: position.id }, data: {
        quantity: 0, costBasisQuote: 0, isOpen: false, closedAt: new Date(),
        decisionCostBasisQuote: 0, simulatedEntryFee: 0, simulatedEntrySlippage: 0,
        actualEntryFee: 0, actualEntrySlippage: 0,
        realisticEntryFee: 0, realisticEntrySlippage: 0,
        ...(excursion ?? {}),
        realizedPnl: { increment: result.realizedPnl }, unrealizedPnl: 0,
      } });
    } else if (position && result.position) {
      await tx.position.update({ where: { id: position.id }, data: {
        quantity: result.position.quantity, averageEntryPrice: result.position.averageEntryPrice,
        costBasisQuote: result.position.costBasisQuote, realizedPnl: result.position.realizedPnl,
        decisionCostBasisQuote: result.position.decisionCostBasisQuote,
        simulatedEntryFee: result.position.simulatedEntryFee,
        simulatedEntrySlippage: result.position.simulatedEntrySlippage,
        actualEntryFee: result.position.actualEntryFee,
        actualEntrySlippage: result.position.actualEntrySlippage,
        realisticEntryFee: result.position.realisticEntryFee,
        realisticEntrySlippage: result.position.realisticEntrySlippage,
        ...(excursion ?? {}),
      } });
    }
    const exit = position && !result.position && excursion
      ? calculateExitEfficiency({ entryPrice: Number(position.averageEntryPrice), exitPrice: price, mfeBps: excursion.mfeBps })
      : null;
    return { ...result, closedExcursion: position && !result.position ? excursion : null, exit };
  }

  private async hydrateSimExchange(bot: BotConfig, exchange: SimExchange): Promise<void> {
    const [positions, realized] = await Promise.all([
      prisma.position.findMany({ where: { botId: bot.id, isOpen: true } }),
      prisma.trade.aggregate({ where: { botId: bot.id }, _sum: { realizedPnl: true } }),
    ]);
    const mapped: Position[] = positions.map((position) => ({
      id: position.id, symbol: position.symbol, quantity: Number(position.quantity),
      averageEntryPrice: Number(position.averageEntryPrice), side: "LONG",
      openedAt: position.openedAt.getTime(), updatedAt: position.updatedAt.getTime(),
      realizedPnl: Number(position.realizedPnl), unrealizedPnl: Number(position.unrealizedPnl),
      costBasisQuote: Number(position.costBasisQuote),
    }));
    const realizedPnl = Number(realized._sum.realizedPnl ?? 0);
    const cash = bot.capitalUSDT + realizedPnl - mapped.reduce((sum, position) => sum + position.costBasisQuote, 0);
    exchange.engine.restore({ cash: Math.max(0, cash), positions: mapped, orders: [], fills: [], trades: [] });
  }

  private async recordBalances(
    bot: BotConfig,
    exchange: IExchange,
    price: number,
    options: { reason?: string; testRunId?: string } = {},
  ): Promise<void> {
    const now = new Date();
    const config = getBalanceSnapshotConfig();
    const latest = await prisma.balanceSnapshot.findFirst({
      where: { botId: bot.id }, orderBy: { timestamp: "desc" }, select: { timestamp: true },
    });
    if ((options.reason ?? "PERIODIC") === "PERIODIC" && !intervalElapsed(latest?.timestamp, now, config.intervalSec)) return;
    const balances = selectRelevantBalances(await exchange.getAccountBalances(), bot.symbol);
    const [base, usdt] = balances;
    const equity = Number(usdt?.free ?? 0) + Number(usdt?.locked ?? 0)
      + (Number(base?.free ?? 0) + Number(base?.locked ?? 0)) * price;
    const previous = latest ? await prisma.balanceSnapshot.findMany({
      where: { botId: bot.id, timestamp: latest.timestamp }, select: { asset: true, free: true, locked: true },
    }) : [];
    const currentComparable = balances.map((balance) => ({ asset: balance.asset, free: balance.free, locked: balance.locked }));
    const previousComparable = previous.map((balance) => ({ asset: balance.asset, free: Number(balance.free), locked: Number(balance.locked) }));
    if (!shouldPersistSnapshot({
      reason: options.reason ?? "PERIODIC",
      intervalHasElapsed: intervalElapsed(latest?.timestamp, now, config.intervalSec),
      balancesChanged: !balancesEqual(currentComparable, previousComparable),
      hasPrevious: Boolean(latest),
    })) return;
    await prisma.balanceSnapshot.createMany({ data: balances.map((balance) => ({
        botId: bot.id, asset: balance.asset, free: balance.free, locked: balance.locked,
        total: balance.free + balance.locked, equityUSDT: equity, timestamp: now,
        reason: options.reason ?? "PERIODIC", testRunId: options.testRunId,
      })) });
  }

  private costModelForTest(test: {
    costModelEnabled: boolean | null;
    realisticTakerFeeBps: Prisma.Decimal | null;
    realisticSlippageBps: Prisma.Decimal | null;
    simulatedMakerFeeBps: Prisma.Decimal | null;
    simulatedTakerFeeBps: Prisma.Decimal | null;
    simulatedSlippageBps: Prisma.Decimal | null;
  } | null): CostModelConfig | null {
    if (!test || test.costModelEnabled === null) return null;
    return {
      enabled: test.costModelEnabled,
      realisticTakerFeeBps: Number(test.realisticTakerFeeBps ?? 0),
      realisticSlippageBps: Number(test.realisticSlippageBps ?? 0),
      simulatedMakerFeeBps: Number(test.simulatedMakerFeeBps ?? 0),
      simulatedTakerFeeBps: Number(test.simulatedTakerFeeBps ?? 0),
      simulatedSlippageBps: Number(test.simulatedSlippageBps ?? 0),
    };
  }

  private positionExcursion(position: {
    lowestPrice: Prisma.Decimal | null; highestPrice: Prisma.Decimal | null;
    maeQuote: Prisma.Decimal | null; maeBps: Prisma.Decimal | null; mfeQuote: Prisma.Decimal | null; mfeBps: Prisma.Decimal | null;
    maeAt: Date | null; mfeAt: Date | null;
  }): Partial<LongExcursionState> | null {
    if (position.lowestPrice === null || position.highestPrice === null) return null;
    return {
      lowestPrice: Number(position.lowestPrice), highestPrice: Number(position.highestPrice),
      maeQuote: Number(position.maeQuote ?? 0), maeBps: Number(position.maeBps ?? 0),
      mfeQuote: Number(position.mfeQuote ?? 0), mfeBps: Number(position.mfeBps ?? 0),
      maeAt: position.maeAt ?? undefined, mfeAt: position.mfeAt ?? undefined,
    };
  }

  private closedTradeTelemetry(accounting: Awaited<ReturnType<ExecutionService["applyPersistedFill"]>>) {
    if (!accounting.closedExcursion) return {};
    const costAsPctOfGrossProfit = accounting.grossPnl > 0
      ? accounting.totalSimulatedCost / accounting.grossPnl * 100
      : null;
    return {
      actualFeeCost: accounting.actualFeeCost,
      realisticFeeCost: accounting.realisticFeeCost,
      simulatedFeeCost: accounting.simulatedFeeCost,
      observedSlippageCost: accounting.observedSlippageCost,
      realisticSlippageCost: accounting.realisticSlippageCost,
      simulatedSlippageCost: accounting.simulatedSlippageCost,
      totalRealisticCost: accounting.totalRealisticCost,
      totalSimulatedCost: accounting.totalSimulatedCost,
      costAsPctOfGrossProfit,
      maeQuote: accounting.closedExcursion.maeQuote,
      maeBps: accounting.closedExcursion.maeBps,
      mfeQuote: accounting.closedExcursion.mfeQuote,
      mfeBps: accounting.closedExcursion.mfeBps,
      maeAt: accounting.closedExcursion.maeAt,
      mfeAt: accounting.closedExcursion.mfeAt,
      exitEfficiencyPct: accounting.grossPnl > 0 ? accounting.exit?.exitEfficiencyPct : null,
      profitGivebackBps: accounting.grossPnl > 0 ? accounting.exit?.profitGivebackBps : null,
    };
  }

  private async incrementTestFinancials(
    tx: Prisma.TransactionClient,
    testRunId: string,
    accounting: ReturnType<typeof reconcileSpotFill>,
    costs: ReturnType<typeof calculateExecutionCosts>,
  ) {
    await tx.botTestRun.update({ where: { id: testRunId }, data: {
      realizedPnl: { increment: accounting.actualNetPnl },
      grossPnl: { increment: accounting.grossPnl },
      actualNetPnl: { increment: accounting.actualNetPnl },
      realisticNetPnl: { increment: accounting.realisticNetPnl },
      simulatedNetPnl: { increment: accounting.simulatedNetPnl },
      exchangeFeeActual: { increment: costs.exchangeFeeActual },
      realisticFee: { increment: costs.realisticFee },
      realisticSlippage: { increment: costs.realisticSlippage },
      simulatedFee: { increment: costs.simulatedFee },
      actualSlippage: { increment: costs.slippageQuote },
      simulatedSlippage: { increment: costs.simulatedSlippage },
    } });
  }

  private emaSellTelemetry(
    position: Position,
    persisted: {
      simulatedEntryFee: Prisma.Decimal | null;
      simulatedEntrySlippage: Prisma.Decimal | null;
      realisticEntryFee: Prisma.Decimal | null;
      realisticEntrySlippage: Prisma.Decimal | null;
      mfeBps: Prisma.Decimal | null;
      openedAt: Date;
    },
    price: number,
  ) {
    const costs = getCostModelConfig();
    const notional = position.quantity * price;
    const grossPnlAtSignal = position.quantity * (price - position.averageEntryPrice);
    const realisticExitCost = notional * (costs.realisticTakerFeeBps + costs.realisticSlippageBps) / 10_000;
    const stressExitCost = notional * (costs.simulatedTakerFeeBps + costs.simulatedSlippageBps) / 10_000;
    const realisticNetPnlAtSignal = grossPnlAtSignal
      - Number(persisted.realisticEntryFee ?? 0) - Number(persisted.realisticEntrySlippage ?? 0) - realisticExitCost;
    const stressNetPnlAtSignal = grossPnlAtSignal
      - Number(persisted.simulatedEntryFee ?? 0) - Number(persisted.simulatedEntrySlippage ?? 0) - stressExitCost;
    const realizedMoveBps = (price / position.averageEntryPrice - 1) * 10_000;
    const mfeBps = Number(persisted.mfeBps ?? 0);
    return {
      exitTelemetryType: "EMA",
      grossPnlAtSignal,
      realisticNetPnlAtSignal,
      stressNetPnlAtSignal,
      mfeBpsAtSignal: mfeBps,
      profitGivebackBpsAtSignal: Math.max(0, mfeBps - Math.max(0, realizedMoveBps)),
      holdingDurationMs: Date.now() - persisted.openedAt.getTime(),
    };
  }

  private mapBot(record: DbBotWithRuntime): BotConfig {
    return {
      id: record.id, userId: record.userId, name: record.name, symbol: record.symbol,
      mode: record.mode, status: record.status, strategy: record.strategyParams && typeof record.strategyParams === "object" && "kind" in record.strategyParams ? String(record.strategyParams.kind) as BotConfig["strategy"] : "EMA_CROSS",
      strategyParams: record.strategyParams as BotConfig["strategyParams"],
      capitalUSDT: Number(record.capitalUSDT), maxCapitalUSDT: Number(record.maxCapitalUSDT),
      maxOrderUSDT: Number(record.maxOrderUSDT), maxPositions: record.maxPositions,
      maxDailyLossUSDT: Number(record.maxDailyLossUSDT), maxDrawdownPct: Number(record.maxDrawdownPct),
      minOrderIntervalMs: record.minOrderIntervalMs, takeProfitPct: record.takeProfitPct ? Number(record.takeProfitPct) : undefined,
      stopLossPct: record.stopLossPct ? Number(record.stopLossPct) : undefined,
      createdAt: record.createdAt.getTime(), updatedAt: record.updatedAt.getTime(),
    };
  }

  private mapRuntime(record: DbBotWithRuntime): BotRuntime {
    return {
      botId: record.id, status: record.runtime?.status ?? record.status,
      lastPrice: record.runtime?.lastPrice ? Number(record.runtime.lastPrice) : undefined,
      lastOrderAt: record.runtime?.lastOrderAt?.getTime(), lastError: record.runtime?.lastError ?? undefined,
      peakEquity: Number(record.runtime?.peakEquity ?? record.capitalUSDT),
      dailyRealizedPnl: record.runtime?.dailyPnlDate && this.isSameUtcDay(record.runtime.dailyPnlDate.getTime(), Date.now())
        ? Number(record.runtime.dailyRealizedPnl)
        : 0,
      dailyPnlDate: record.runtime?.dailyPnlDate.getTime(),
      strategyState: (record.runtime?.strategyState as Record<string, unknown>) ?? {},
      updatedAt: record.runtime?.updatedAt.getTime() ?? Date.now(),
    };
  }

  private async recordFailure(botId: string, error: unknown): Promise<void> {
    const message = redactSensitive(error instanceof Error ? error.message : "Unknown worker error");
    const current = await prisma.botRuntime.findUnique({ where: { botId }, select: { consecutiveFailures: true } });
    const failures = (current?.consecutiveFailures ?? 0) + 1;
    const config = getWorkerConfig();
    const exhausted = failures >= config.retryLimit;
    const delayMs = Math.min(config.maxBackoffMs, config.pollMs * (2 ** Math.min(failures - 1, config.retryLimit - 1)));
    await prisma.$transaction([
      prisma.botConfig.update({ where: { id: botId }, data: { status: exhausted ? "ERROR" : "RUNNING" } }),
      prisma.botRuntime.upsert({
        where: { botId },
        create: { botId, status: exhausted ? "ERROR" : "RUNNING", lastError: message, strategyState: {}, consecutiveFailures: failures, nextRetryAt: exhausted ? null : new Date(Date.now() + delayMs) },
        update: { status: exhausted ? "ERROR" : "RUNNING", lastError: message, consecutiveFailures: failures, nextRetryAt: exhausted ? null : new Date(Date.now() + delayMs) },
      }),
      prisma.botLog.create({ data: {
        botId, level: "ERROR", event: exhausted ? "WORKER_RETRY_EXHAUSTED" : "WORKER_CYCLE_RETRY_SCHEDULED", message,
        metadata: { failures, retryLimit: config.retryLimit, nextRetryInMs: exhausted ? null : delayMs },
      } }),
    ]);
    await recordTestFailure(botId, message, exhausted);
  }

  private isSameUtcDay(timestamp: number | undefined, now: number): boolean {
    if (!timestamp) return false;
    return new Date(timestamp).toISOString().slice(0, 10) === new Date(now).toISOString().slice(0, 10);
  }
}
