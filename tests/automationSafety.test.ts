import { describe, expect, it } from "vitest";
import { createRiskRuntimeReset, resolveAutomaticBuyUSDT, validateAutomaticSpotPreflight } from "@/lib/trading/automationPolicy";
import { evaluateRisk } from "@/lib/trading/riskManager";
import type { BotConfig, SymbolInfo } from "@/lib/trading/domain";

const bot: BotConfig = {
  id: "seed-ema-cross",
  userId: "user",
  name: "EMA Cross Seed",
  symbol: "BTCUSDT",
  mode: "TESTNET",
  status: "STOPPED",
  strategy: "EMA_CROSS",
  strategyParams: { kind: "EMA_CROSS", shortPeriod: 9, longPeriod: 21, fixedOrderUSDT: 6 },
  capitalUSDT: 10,
  maxCapitalUSDT: 10,
  maxOrderUSDT: 6,
  maxPositions: 1,
  maxDailyLossUSDT: 1,
  maxDrawdownPct: 10,
  minOrderIntervalMs: 300_000,
  takeProfitPct: 2,
  stopLossPct: 1,
  createdAt: 0,
  updatedAt: 0,
};

const symbolInfo: SymbolInfo = {
  symbol: "BTCUSDT",
  status: "TRADING",
  baseAsset: "BTC",
  quoteAsset: "USDT",
  spotAllowed: true,
  filter: { minPrice: 0.01, maxPrice: 1_000_000, tickSize: 0.01, minQuantity: 0.00001, maxQuantity: 9_000, stepSize: 0.00001, minNotional: 5 },
};

describe("automatic Testnet safety policy", () => {
  it("uses the explicit 6 USDT order and validates it above Binance minimum", () => {
    const requestedOrderUSDT = resolveAutomaticBuyUSDT(bot);
    expect(requestedOrderUSDT).toBe(6);
    const result = validateAutomaticSpotPreflight({
      side: "BUY",
      symbolInfo,
      marketPrice: 60_000,
      requestedOrderUSDT,
      normalizedQuantity: 0.0001,
      balances: [{ asset: "USDT", free: 100, locked: 0 }],
    });
    expect(result.conservativeNotional).toBe(6);
  });

  it("rejects an automatic buy below Testnet minimum before submission", () => {
    expect(() => validateAutomaticSpotPreflight({
      side: "BUY",
      symbolInfo,
      marketPrice: 60_000,
      requestedOrderUSDT: 1,
      normalizedQuantity: 0.00001,
      balances: [{ asset: "USDT", free: 100, locked: 0 }],
    })).toThrow(/min notional/i);
  });

  it("resets risk runtime to the new capital without false drawdown", () => {
    const reset = createRiskRuntimeReset(10, new Date("2026-08-07T00:00:00.000Z"));
    expect(reset.peakEquity).toBe(10);
    expect(reset.dailyRealizedPnl).toBe(0);
    expect(reset.strategyState).toEqual({});
    const decision = evaluateRisk({
      bot: { ...bot, status: "RUNNING" },
      runtime: { botId: bot.id, status: "RUNNING", peakEquity: reset.peakEquity, dailyRealizedPnl: 0, strategyState: {}, updatedAt: 0 },
      signal: { kind: "BUY", symbol: "BTCUSDT", strategy: "EMA_CROSS", reason: "test", timestamp: 0 },
      requestedOrderUSDT: 6,
      openPositions: [],
      equityUSDT: 10,
      killSwitchActive: false,
      hasPendingOrder: false,
      now: 10_000,
    });
    expect(decision.code).toBe("ALLOWED");
  });
});
