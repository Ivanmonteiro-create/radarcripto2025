import { randomUUID } from "node:crypto";
import type { OrderSide, OrderType } from "@/lib/trading/domain";
import { ApiError } from "./api";
import { createExchange } from "./exchangeFactory";
import { binanceHealth, databaseHealth, workerHealth } from "./health";
import { prisma } from "./prisma";
import { redactSensitive } from "./redact";
import { ExecutionService } from "./executionService";
import { getTradingMode } from "./env";

export interface ManualTestnetOrderInput {
  botId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity?: number;
  quoteOrderQty?: number;
  price?: number;
}

export async function executeManualTestnetOrder(input: ManualTestnetOrderInput) {
  if (getTradingMode() !== "TESTNET") throw new ApiError(409, "TESTNET_ENVIRONMENT_DISABLED");
  const [database, worker, binance] = await Promise.all([
    databaseHealth(), workerHealth(), binanceHealth(input.symbol),
  ]);
  if (database.state !== "HEALTHY") throw new ApiError(503, "DATABASE_UNHEALTHY");
  if (worker.state !== "HEALTHY") throw new ApiError(503, "WORKER_UNHEALTHY");
  if (binance.state !== "HEALTHY") throw new ApiError(503, "BINANCE_TESTNET_UNHEALTHY");

  const bot = await prisma.botConfig.findUnique({ where: { id: input.botId } });
  if (!bot) throw new ApiError(404, "BOT_NOT_FOUND");
  if (bot.mode !== "TESTNET") throw new ApiError(409, "BOT_IS_NOT_TESTNET");
  if (bot.status === "RUNNING") throw new ApiError(409, "MANUAL_ORDER_REQUIRES_STOPPED_BOT");
  if (bot.symbol !== input.symbol) throw new ApiError(400, "SYMBOL_DOES_NOT_MATCH_BOT");
  const control = await prisma.systemControl.findUnique({ where: { id: "global" } });
  if (control?.killSwitchActive) throw new ApiError(409, "KILL_SWITCH_ACTIVE");
  const existing = await prisma.order.findFirst({
    where: { botId: bot.id, symbol: input.symbol, side: input.side, status: { in: ["PENDING", "UNKNOWN", "OPEN", "PARTIALLY_FILLED"] } },
  });
  if (existing) throw new ApiError(409, "EQUIVALENT_ORDER_ALREADY_OPEN");

  const exchange = await createExchange("TESTNET", bot.id);
  const [symbolInfo, ticker, balances] = await Promise.all([
    exchange.getSymbolInfo(input.symbol), exchange.getTickerPrice(input.symbol), exchange.getAccountBalances(),
  ]);
  if (!symbolInfo.spotAllowed || symbolInfo.status !== "TRADING") throw new ApiError(409, "SPOT_SYMBOL_NOT_TRADING");
  const quantity = input.quantity === undefined ? undefined : await exchange.normalizeQuantity(input.symbol, input.quantity);
  const price = input.price === undefined ? undefined : await exchange.normalizePrice(input.symbol, input.price);
  const notional = input.quoteOrderQty ?? ((quantity ?? 0) * (price ?? ticker));
  if (!Number.isFinite(notional) || notional < symbolInfo.filter.minNotional) throw new ApiError(400, "ORDER_BELOW_MIN_NOTIONAL");
  if (notional > Number(bot.maxOrderUSDT)) throw new ApiError(409, "ORDER_EXCEEDS_BOT_LIMIT");
  const requiredAsset = input.side === "BUY" ? "USDT" : symbolInfo.baseAsset;
  const requiredAmount = input.side === "BUY" ? notional : (quantity ?? 0);
  const balance = balances.find((item) => item.asset === requiredAsset);
  if (!balance || balance.free < requiredAmount) throw new ApiError(409, "INSUFFICIENT_TESTNET_BALANCE");

  const clientOrderId = `rc-manual-${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const pending = await prisma.order.create({ data: {
    botId: bot.id,
    clientOrderId,
    symbol: input.symbol,
    side: input.side,
    type: input.type,
    status: "PENDING",
    requestedQuantity: quantity ?? notional / ticker,
    requestedPrice: price,
  } });
  await prisma.botLog.create({ data: {
    botId: bot.id, level: "INFO", event: "MANUAL_TESTNET_ORDER_AUTHORIZED",
    message: `Manual Testnet ${input.side} ${input.type} authorized for ${input.symbol}`,
    metadata: { orderId: pending.id, notional },
  } });
  try {
    const result = input.type === "MARKET"
      ? await exchange.createMarketOrder({
          symbol: input.symbol, side: input.side, quantity,
          quoteOrderQty: input.side === "BUY" ? input.quoteOrderQty : undefined, clientOrderId,
        })
      : await exchange.createLimitOrder({
          symbol: input.symbol, side: input.side, quantity: quantity!, price: price!, clientOrderId,
        });
    await prisma.order.update({ where: { id: pending.id }, data: {
      exchangeOrderId: result.order.exchangeOrderId ?? result.order.id,
      status: result.order.status,
      executedQuantity: result.order.executedQuantity,
      averageFillPrice: result.order.averageFillPrice,
      exchangeUpdatedAt: new Date(result.order.updatedAt),
    } });
    await new ExecutionService().reconcileOrder(pending.id);
  } catch (error) {
    const message = redactSensitive(error instanceof Error ? error.message : "Manual Testnet order response was uncertain");
    await prisma.order.update({ where: { id: pending.id }, data: {
      status: "UNKNOWN", submissionUncertain: true, lastReconciliationError: message,
    } });
    throw new ApiError(502, "TESTNET_ORDER_SUBMISSION_UNCERTAIN", { orderId: pending.id });
  }
  return prisma.order.findUnique({
    where: { id: pending.id }, include: { fills: true, bot: { include: { positions: { where: { isOpen: true } } } } },
  });
}

export async function cancelManualTestnetOrder(orderId: string) {
  if (getTradingMode() !== "TESTNET") throw new ApiError(409, "TESTNET_ENVIRONMENT_DISABLED");
  const local = await prisma.order.findUnique({ where: { id: orderId }, include: { bot: true } });
  if (!local) throw new ApiError(404, "ORDER_NOT_FOUND");
  if (local.bot.mode !== "TESTNET" || local.bot.status === "RUNNING") throw new ApiError(409, "MANUAL_CANCEL_REQUIRES_STOPPED_TESTNET_BOT");
  if (!local.exchangeOrderId || !["PENDING", "UNKNOWN", "OPEN", "PARTIALLY_FILLED"].includes(local.status)) {
    throw new ApiError(409, "ORDER_NOT_CANCELLABLE");
  }
  const exchange = await createExchange("TESTNET", local.botId);
  const cancelled = await exchange.cancelOrder(local.symbol, local.exchangeOrderId);
  await prisma.order.update({ where: { id: local.id }, data: { status: cancelled.status, exchangeUpdatedAt: new Date(cancelled.updatedAt) } });
  await new ExecutionService().reconcileOrder(local.id);
  return prisma.order.findUnique({ where: { id: local.id }, include: { fills: true } });
}
