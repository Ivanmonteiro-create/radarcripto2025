import { describe, expect, it } from "vitest";
import { evaluateRisk, type RiskContext } from "@/lib/trading/riskManager";

const base: RiskContext = {
  bot: {
    id: "bot", userId: "user", name: "bot", symbol: "BTCUSDT", mode: "SIM", status: "RUNNING",
    strategy: "EMA_CROSS", strategyParams: {}, capitalUSDT: 1_000, maxCapitalUSDT: 1_000,
    maxOrderUSDT: 100, maxPositions: 1, maxDailyLossUSDT: 50, maxDrawdownPct: 10,
    minOrderIntervalMs: 1_000, createdAt: 0, updatedAt: 0,
  },
  runtime: { botId: "bot", status: "RUNNING", peakEquity: 1_000, dailyRealizedPnl: 0, strategyState: {}, updatedAt: 0 },
  signal: { kind: "BUY", symbol: "BTCUSDT", strategy: "EMA_CROSS", reason: "test", timestamp: 0 },
  requestedOrderUSDT: 100, openPositions: [], equityUSDT: 1_000,
  killSwitchActive: false, hasPendingOrder: false, now: 10_000,
};

describe("risk manager", () => {
  it("allows a valid Spot order", () => expect(evaluateRisk(base).code).toBe("ALLOWED"));
  it("blocks kill switch", () => expect(evaluateRisk({ ...base, killSwitchActive: true }).code).toBe("KILL_SWITCH"));
  it("blocks any second pending order for the bot", () => expect(evaluateRisk({ ...base, hasPendingOrder: true }).code).toBe("DUPLICATE_ORDER"));
  it("blocks a second open position", () => {
    const position = { id: "position", symbol: "BTCUSDT", quantity: 0.001, averageEntryPrice: 60_000, side: "LONG" as const, openedAt: 0, updatedAt: 0, realizedPnl: 0, unrealizedPnl: 0, costBasisQuote: 60 };
    expect(evaluateRisk({ ...base, openPositions: [position] }).code).toBe("POSITION_LIMIT");
  });
  it("blocks daily loss and drawdown", () => {
    expect(evaluateRisk({ ...base, runtime: { ...base.runtime, dailyRealizedPnl: -50 } }).code).toBe("DAILY_LOSS_LIMIT");
    expect(evaluateRisk({ ...base, equityUSDT: 899 }).code).toBe("DRAWDOWN_LIMIT");
  });
  it("blocks invalid symbols, order limits and cooldown", () => {
    expect(evaluateRisk({ ...base, signal: { ...base.signal, symbol: "ETHUSDT" } }).code).toBe("INVALID_SYMBOL");
    expect(evaluateRisk({ ...base, requestedOrderUSDT: 101 }).code).toBe("ORDER_LIMIT");
    expect(evaluateRisk({ ...base, runtime: { ...base.runtime, lastOrderAt: 9_500 } }).code).toBe("ORDER_COOLDOWN");
  });
  it.each(["Server stop-loss reached", "Server take-profit reached", "Short EMA crossed below long EMA"])("lets risk-reducing sells bypass entry cooldown: %s", (reason) => {
    const position = { id: "position", symbol: "BTCUSDT", quantity: 0.001, averageEntryPrice: 60_000, side: "LONG" as const, openedAt: 0, updatedAt: 0, realizedPnl: 0, unrealizedPnl: 0, costBasisQuote: 60 };
    const result = evaluateRisk({
      ...base,
      signal: { ...base.signal, kind: "SELL", reason },
      runtime: { ...base.runtime, lastOrderAt: 9_500 },
      requestedOrderUSDT: 60,
      openPositions: [position],
    });
    expect(result.code).toBe("ALLOWED");
  });
});
