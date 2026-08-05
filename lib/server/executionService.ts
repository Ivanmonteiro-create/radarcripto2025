import { randomUUID } from "node:crypto";
import { Prisma, type BotConfig as DbBotConfig, type BotRuntime as DbBotRuntime } from "@prisma/client";
import { SimExchange } from "@/lib/exchanges/SimExchange";
import type { IExchange } from "@/lib/exchanges/IExchange";
import type { BotConfig, BotRuntime, Position, StrategySignal } from "@/lib/trading/domain";
import { EmaCrossStrategy, type EmaCrossState } from "@/lib/trading/strategies/emaCross";
import { PercentCycleStrategy, type PercentCycleState } from "@/lib/trading/strategies/percentCycle";
import { evaluateRisk } from "@/lib/trading/riskManager";
import { reconcileSpotFill } from "@/lib/trading/positionAccounting";
import { createExchange } from "./exchangeFactory";
import { getTestnetSpotPrice } from "./publicPrice";
import { prisma } from "./prisma";
import { redactSensitive } from "./redact";

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
    const exchange = createExchange(bot.mode, bot.id);
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
    await this.recordBalances(bot, exchange, price);
  }

  async runActiveBots(): Promise<void> {
    const bots = await prisma.botConfig.findMany({ where: { status: "RUNNING" }, select: { id: true } });
    for (const bot of bots) {
      try {
        await this.runBotCycle(bot.id);
      } catch (error) {
        await this.recordFailure(bot.id, error);
      }
    }
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
    const bot = this.mapBot(record);
    const runtime = this.mapRuntime(record);
    const exchange = createExchange(bot.mode, bot.id);
    if (exchange instanceof SimExchange) await this.hydrateSimExchange(bot, exchange);
    const price = bot.mode === "SIM" ? await getTestnetSpotPrice(bot.symbol) : await exchange.getTickerPrice(bot.symbol);
    if (exchange instanceof SimExchange) exchange.setTickerPrice(bot.symbol, price);
    const dbPositions = await prisma.position.findMany({ where: { botId, isOpen: true } });
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
    let signal = this.generateSignal(bot, runtime, price);
    if (currentPosition) {
      const changePct = ((price - currentPosition.averageEntryPrice) / currentPosition.averageEntryPrice) * 100;
      if (bot.takeProfitPct && changePct >= bot.takeProfitPct) {
        signal = { kind: "SELL", symbol: bot.symbol, strategy: bot.strategy, reason: "Server take-profit reached", timestamp: Date.now() };
      } else if (bot.stopLossPct && changePct <= -bot.stopLossPct) {
        signal = { kind: "SELL", symbol: bot.symbol, strategy: bot.strategy, reason: "Server stop-loss reached", timestamp: Date.now() };
      }
    }

    await prisma.botRuntime.upsert({
      where: { botId },
      create: {
        botId, status: "RUNNING", lastPrice: price, lastSignal: signal.kind,
        lastSignalReason: signal.reason,
        strategyState: jsonValue(runtime.strategyState), workerHeartbeatAt: new Date(), peakEquity: Math.max(runtime.peakEquity, estimatedEquity),
      },
      update: {
        status: "RUNNING", lastPrice: price, lastSignal: signal.kind,
        lastSignalReason: signal.reason, strategyState: jsonValue(runtime.strategyState),
        workerHeartbeatAt: new Date(), lastError: null,
        peakEquity: Math.max(runtime.peakEquity, estimatedEquity),
        ...(this.isSameUtcDay(runtime.dailyPnlDate, Date.now()) ? {} : { dailyRealizedPnl: 0, dailyPnlDate: new Date() }),
      },
    });
    await this.recordBalances(bot, exchange, price);
    if (signal.kind === "HOLD") return;

    if (signal.kind === "SELL" && !currentPosition) return;
    const requestedOrderUSDT = signal.kind === "BUY"
      ? Math.min(bot.capitalUSDT * 0.1, bot.maxOrderUSDT)
      : (currentPosition?.quantity ?? 0) * price;
    const duplicate = await prisma.order.findFirst({
      where: { botId, symbol: bot.symbol, side: signal.kind, status: { in: ["PENDING", "OPEN", "PARTIALLY_FILLED"] } },
      select: { id: true },
    });
    const system = await prisma.systemControl.findUnique({ where: { id: "global" } });
    const equity = estimatedEquity;
    const decision = evaluateRisk({
      bot, runtime, signal, requestedOrderUSDT, openPositions: positions, equityUSDT: equity,
      killSwitchActive: system?.killSwitchActive ?? false, hasEquivalentOpenOrder: Boolean(duplicate),
    });
    await prisma.riskEvent.create({
      data: { botId, allowed: decision.allowed, code: decision.code, reason: decision.reason, signal: jsonValue(signal) },
    });
    if (!decision.allowed) return;
    await this.executeSignal(bot, runtime, signal, exchange, price, currentPosition, decision.maxOrderUSDT ?? requestedOrderUSDT);
  }

  private generateSignal(bot: BotConfig, runtime: BotRuntime, price: number): StrategySignal {
    if (bot.strategy === "EMA_CROSS") {
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
  ): Promise<void> {
    const clientOrderId = `rc-${bot.id.slice(0, 8)}-${randomUUID().slice(0, 12)}`;
    const quantity = signal.kind === "SELL" ? currentPosition?.quantity : undefined;
    const pending = await prisma.order.create({
      data: {
        botId: bot.id, clientOrderId, symbol: bot.symbol, side: signal.kind === "BUY" ? "BUY" : "SELL",
        type: "MARKET", status: "PENDING", requestedQuantity: quantity ?? orderValue / price,
      },
    });
    try {
      const result = await exchange.createMarketOrder({
        symbol: bot.symbol, side: signal.kind === "BUY" ? "BUY" : "SELL",
        quantity, quoteOrderQty: signal.kind === "BUY" ? orderValue : undefined, clientOrderId,
      });
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
        await tx.order.update({
          where: { id: pending.id },
          data: {
            exchangeOrderId: result.order.exchangeOrderId ?? result.order.id,
            status: result.order.status, executedQuantity: result.order.executedQuantity,
            averageFillPrice: result.order.averageFillPrice, rejectReason: result.order.rejectReason,
          },
        });
        for (const fill of result.fills) {
          const dbFill = await tx.fill.create({
            data: {
              botId: bot.id, orderId: pending.id, exchangeFillId: fill.id, symbol: fill.symbol,
              side: fill.side, price: fill.price, quantity: fill.quantity, feeQuote: fill.feeQuote,
              timestamp: new Date(fill.timestamp),
            },
          });
          const realizedPnl = await this.applyPersistedFill(tx, bot.id, dbFill.symbol, dbFill.side, Number(dbFill.quantity), Number(dbFill.price), Number(dbFill.feeQuote));
          await tx.trade.create({
            data: {
              botId: bot.id, orderId: pending.id, symbol: fill.symbol, side: fill.side,
              price: fill.price, quantity: fill.quantity, notionalQuote: fill.price * fill.quantity,
              feeQuote: fill.feeQuote, realizedPnl, timestamp: new Date(fill.timestamp),
            },
          });
          if (realizedPnl !== 0) {
            await tx.botRuntime.update({ where: { botId: bot.id }, data: { dailyRealizedPnl: { increment: realizedPnl }, dailyPnlDate: new Date() } });
          }
        }
        await tx.botRuntime.update({
          where: { botId: bot.id }, data: { lastOrderAt: new Date(), strategyState: jsonValue(runtime.strategyState) },
        });
        await tx.botLog.create({ data: { botId: bot.id, level: "INFO", event: "ORDER_RECONCILED", message: `Order ${pending.id} reconciled as ${result.order.status}` } });
      });
    } catch (error) {
      const message = redactSensitive(error instanceof Error ? error.message : "Order failed");
      await prisma.order.update({ where: { id: pending.id }, data: { status: "REJECTED", rejectReason: message } });
      throw error;
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
  ): Promise<number> {
    const position = await tx.position.findFirst({ where: { botId, symbol, isOpen: true } });
    const result = reconcileSpotFill(position ? {
      quantity: Number(position.quantity), averageEntryPrice: Number(position.averageEntryPrice),
      costBasisQuote: Number(position.costBasisQuote), realizedPnl: Number(position.realizedPnl),
    } : null, { side, quantity, price, feeQuote: fee });
    if (!position && result.position) {
      await tx.position.create({ data: {
        botId, symbol, quantity: result.position.quantity, averageEntryPrice: result.position.averageEntryPrice,
        costBasisQuote: result.position.costBasisQuote, realizedPnl: result.position.realizedPnl,
        openedAt: new Date(), side: "LONG",
      } });
    } else if (position && !result.position) {
      await tx.position.update({ where: { id: position.id }, data: {
        quantity: 0, costBasisQuote: 0, isOpen: false, closedAt: new Date(),
        realizedPnl: { increment: result.realizedPnl }, unrealizedPnl: 0,
      } });
    } else if (position && result.position) {
      await tx.position.update({ where: { id: position.id }, data: {
        quantity: result.position.quantity, averageEntryPrice: result.position.averageEntryPrice,
        costBasisQuote: result.position.costBasisQuote, realizedPnl: result.position.realizedPnl,
      } });
    }
    return result.realizedPnl;
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

  private async recordBalances(bot: BotConfig, exchange: IExchange, price: number): Promise<void> {
    const balances = (await exchange.getAccountBalances()).filter((balance) => balance.free + balance.locked > 0);
    const baseAsset = bot.symbol.replace(/USDT$/, "");
    const usdt = balances.find((balance) => balance.asset === "USDT");
    const base = balances.find((balance) => balance.asset === baseAsset);
    const equity = Number(usdt?.free ?? 0) + Number(usdt?.locked ?? 0)
      + (Number(base?.free ?? 0) + Number(base?.locked ?? 0)) * price;
    if (balances.length) {
      await prisma.balanceSnapshot.createMany({ data: balances.map((balance) => ({
        botId: bot.id, asset: balance.asset, free: balance.free, locked: balance.locked,
        total: balance.free + balance.locked, equityUSDT: equity,
      })) });
    }
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
    await prisma.$transaction([
      prisma.botConfig.update({ where: { id: botId }, data: { status: "ERROR" } }),
      prisma.botRuntime.upsert({ where: { botId }, create: { botId, status: "ERROR", lastError: message, strategyState: {} }, update: { status: "ERROR", lastError: message } }),
      prisma.botLog.create({ data: { botId, level: "ERROR", event: "WORKER_CYCLE_FAILED", message } }),
    ]);
  }

  private isSameUtcDay(timestamp: number | undefined, now: number): boolean {
    if (!timestamp) return false;
    return new Date(timestamp).toISOString().slice(0, 10) === new Date(now).toISOString().slice(0, 10);
  }
}
