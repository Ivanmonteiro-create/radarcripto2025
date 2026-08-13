import { describe, expect, it } from "vitest";
import { resolveProtectiveExit } from "@/lib/trading/automationPolicy";
import type { Position, StrategySignal } from "@/lib/trading/domain";
import { EmaCrossA2Strategy, type EmaCrossA2Config, type EmaCrossA2State } from "@/lib/trading/strategies/emaCrossA2";
import { calculateExitEfficiency, updateLongExcursion } from "@/lib/trading/tradeExcursions";

const baseConfig: EmaCrossA2Config = {
  shortPeriod: 9, longPeriod: 21, rollingRangeWindow: 21,
  minExpectedEdgeBps: 0, minEmaSeparationBps: 0.01, minRollingRangeBps: 0,
  simulatedEntryFeeBps: 0, simulatedExitFeeBps: 0,
  simulatedEntrySlippageBps: 0, simulatedExitSlippageBps: 0,
};

const bullishCrossState = (): EmaCrossA2State => ({
  ema: { observations: 21, shortEma: 99.999, longEma: 100, previousDifference: -0.001 },
  prices: Array.from({ length: 20 }, () => 100),
});

const bearishCrossState = (): EmaCrossA2State => ({
  ema: { observations: 21, shortEma: 100.001, longEma: 100, previousDifference: 0.001 },
  prices: Array.from({ length: 20 }, () => 100),
});

function run(config: Partial<EmaCrossA2Config>, state = bullishCrossState(), price = 100.01) {
  const strategy = new EmaCrossA2Strategy("BTCUSDT", { ...baseConfig, ...config });
  strategy.restore(state);
  return strategy.update(price, 1);
}

describe("EMA 9/21 A2 filters", () => {
  it("blocks BUY when the reproducible rolling-range edge does not cover costs", () => {
    const signal = run({
      simulatedEntryFeeBps: 10, simulatedExitFeeBps: 10,
      simulatedEntrySlippageBps: 5, simulatedExitSlippageBps: 5,
      minExpectedEdgeBps: 5,
    });
    expect(signal.kind).toBe("HOLD");
    expect(signal.metadata).toMatchObject({ filterCode: "INSUFFICIENT_EXPECTED_EDGE", estimatedCostBps: 30, requiredEdgeBps: 35 });
    expect(Number(signal.metadata?.expectedMoveBps)).toBeCloseTo(0.9999);
  });

  it("filters a microcrossover and later confirms separation without inventing another cross", () => {
    const strategy = new EmaCrossA2Strategy("BTCUSDT", { ...baseConfig, minEmaSeparationBps: 0.1 });
    strategy.restore(bullishCrossState());
    const filtered = strategy.update(100.01, 1);
    expect(filtered.metadata?.filterCode).toBe("MICRO_CROSSOVER_FILTERED");
    const confirmed = strategy.update(100.2, 2);
    expect(confirmed.kind).toBe("BUY");
    expect(confirmed.metadata?.crossoverConfirmed).toBe(true);
  });

  it("allows a confirmed crossover and blocks insufficient rolling range", () => {
    expect(run({}).kind).toBe("BUY");
    const blocked = run({ minRollingRangeBps: 2 });
    expect(blocked.metadata?.filterCode).toBe("INSUFFICIENT_MARKET_RANGE");
  });

  it("does not apply entry cost or range filters to an EMA SELL", () => {
    const signal = run({
      minExpectedEdgeBps: 10_000, minRollingRangeBps: 10_000,
      simulatedEntryFeeBps: 1_000, simulatedExitFeeBps: 1_000,
    }, bearishCrossState(), 99.99);
    expect(signal.kind).toBe("SELL");
  });
});

describe("MAE, MFE and protective exits", () => {
  it("tracks exact MAE and MFE for a long position", () => {
    const first = updateLongExcursion({ entryPrice: 100, quantity: 2, currentPrice: 95, now: new Date("2026-08-10T00:00:00Z") });
    const second = updateLongExcursion({ entryPrice: 100, quantity: 2, currentPrice: 110, now: new Date("2026-08-10T00:01:00Z"), previous: first });
    expect(second.maeQuote).toBe(10);
    expect(second.maeBps).toBe(500);
    expect(second.mfeQuote).toBe(20);
    expect(second.mfeBps).toBe(1_000);
  });

  it("calculates exit efficiency and profit giveback without misleading losing trades", () => {
    expect(calculateExitEfficiency({ entryPrice: 100, exitPrice: 108, mfeBps: 1_000 })).toEqual({
      realizedMoveBps: 800, exitEfficiencyPct: 80, profitGivebackBps: 200,
    });
    expect(calculateExitEfficiency({ entryPrice: 100, exitPrice: 99, mfeBps: 200 }).exitEfficiencyPct).toBeNull();
  });

  it("keeps TP and SL independent from an A2 filtered HOLD", () => {
    const filtered: StrategySignal = { kind: "HOLD", symbol: "BTCUSDT", strategy: "EMA_CROSS", reason: "filtered", timestamp: 0 };
    const position: Position = {
      id: "p", symbol: "BTCUSDT", quantity: 1, averageEntryPrice: 100, side: "LONG",
      openedAt: 0, updatedAt: 0, realizedPnl: 0, unrealizedPnl: 0, costBasisQuote: 100,
    };
    expect(resolveProtectiveExit({ signal: filtered, position, price: 102, takeProfitPct: 2, stopLossPct: 1 }).reason).toMatch(/take-profit/);
    expect(resolveProtectiveExit({ signal: filtered, position, price: 99, takeProfitPct: 2, stopLossPct: 1 }).reason).toMatch(/stop-loss/);
  });
});
