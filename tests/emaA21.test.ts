import { describe, expect, it } from "vitest";
import { EmaCrossStrategy } from "@/lib/trading/strategies/emaCross";
import { EmaCrossA2Strategy } from "@/lib/trading/strategies/emaCrossA2";
import {
  calculateExpectedMoveA21,
  EmaCrossA21Strategy,
  type EmaCrossA21Config,
  type EmaCrossA21State,
} from "@/lib/trading/strategies/emaCrossA21";

const now = Date.parse("2026-08-10T20:00:00Z");
const baseConfig: EmaCrossA21Config = {
  shortPeriod: 9,
  longPeriod: 21,
  samplingIntervalMs: 5_000,
  minExpectedEdgeBps: 0,
  minEmaSeparationBps: 0.1,
  minRange5mBps: 3,
  minRange15mBps: 6,
  realisticEntryFeeBps: 2,
  realisticExitFeeBps: 2,
  realisticEntrySlippageBps: 1,
  realisticExitSlippageBps: 1,
  stressEntryFeeBps: 10,
  stressExitFeeBps: 10,
  stressEntrySlippageBps: 5,
  stressExitSlippageBps: 5,
};

function bullishState(): EmaCrossA21State {
  return {
    ema: { observations: 21, shortEma: 99.999, longEma: 100, previousDifference: -0.001 },
    points: [
      { timestamp: now - 15 * 60_000, price: 99.5 },
      { timestamp: now - 5 * 60_000, price: 99.7 },
      { timestamp: now - 2 * 60_000, price: 99.9 },
    ],
  };
}

function run(config: Partial<EmaCrossA21Config> = {}, price = 100.2) {
  const strategy = new EmaCrossA21Strategy("BTCUSDT", { ...baseConfig, ...config });
  strategy.restore(bullishState());
  return strategy.update(price, now);
}

describe("EMA 9/21 A2.1", () => {
  it("calculates ticker-based ranges for 2m, 5m and 15m", () => {
    const signal = run({}, 100);
    expect(Number(signal.metadata?.range2mBps)).toBeCloseTo(10);
    expect(Number(signal.metadata?.range5mBps)).toBeCloseTo(30);
    expect(Number(signal.metadata?.range15mBps)).toBeCloseTo(50);
    expect(Number(signal.metadata?.momentum15mBps)).toBeCloseTo(50.251256, 5);
  });

  it("uses the documented reproducible expected-move formula", () => {
    expect(calculateExpectedMoveA21({
      side: "BUY", range5mBps: 20, range15mBps: 60,
      momentum2mBps: 1, momentum5mBps: 2, momentum15mBps: -1,
    })).toEqual({ expectedMoveBps: 32, persistenceFactor: 0.8, alignedWindows: 2 });
  });

  it("does not use stress cost as an entry gate", () => {
    const signal = run({
      stressEntryFeeBps: 100, stressExitFeeBps: 100,
      stressEntrySlippageBps: 100, stressExitSlippageBps: 100,
    });
    expect(signal.kind).toBe("BUY");
    expect(signal.metadata?.stressRoundTripCostBps).toBe(400);
  });

  it("blocks entry when the realistic cost is not covered", () => {
    const signal = run({ realisticEntryFeeBps: 100, realisticExitFeeBps: 100 });
    expect(signal.kind).toBe("HOLD");
    expect(signal.metadata?.filterCode).toBe("INSUFFICIENT_REALISTIC_EDGE");
  });

  it("filters below 0.1 bps and confirms the pending crossover later", () => {
    const strategy = new EmaCrossA21Strategy("BTCUSDT", { ...baseConfig, minRange5mBps: 0, minRange15mBps: 0 });
    strategy.restore(bullishState());
    const filtered = strategy.update(100.01, now);
    expect(filtered.metadata?.filterCode).toBe("MICRO_CROSSOVER_FILTERED");
    const confirmed = strategy.update(100.2, now + 5_000);
    expect(confirmed.kind).toBe("BUY");
  });

  it("leaves the original A and rigid A2 implementations available", () => {
    expect(new EmaCrossStrategy("BTCUSDT", { shortPeriod: 9, longPeriod: 21 })).toBeInstanceOf(EmaCrossStrategy);
    expect(new EmaCrossA2Strategy("BTCUSDT", {
      shortPeriod: 9, longPeriod: 21, rollingRangeWindow: 21,
      minExpectedEdgeBps: 5, minEmaSeparationBps: 0.5, minRollingRangeBps: 20,
      simulatedEntryFeeBps: 10, simulatedExitFeeBps: 10,
      simulatedEntrySlippageBps: 5, simulatedExitSlippageBps: 5,
    })).toBeInstanceOf(EmaCrossA2Strategy);
  });
});
