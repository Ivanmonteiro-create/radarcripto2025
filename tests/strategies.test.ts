import { describe, expect, it } from "vitest";
import { EmaCrossStrategy } from "@/lib/trading/strategies/emaCross";
import { PercentCycleStrategy } from "@/lib/trading/strategies/percentCycle";

describe("EMA Cross", () => {
  it("does not signal before long-period warm-up", () => {
    const strategy = new EmaCrossStrategy("BTCUSDT", { shortPeriod: 2, longPeriod: 4 });
    expect(strategy.update(100).kind).toBe("HOLD");
    expect(strategy.update(90).kind).toBe("HOLD");
    expect(strategy.update(80).kind).toBe("HOLD");
    expect(strategy.snapshot().observations).toBe(3);
    expect(strategy.update(120).kind).toBe("BUY");
  });

  it("keeps instances isolated and can reset state", () => {
    const first = new EmaCrossStrategy("BTCUSDT", { shortPeriod: 2, longPeriod: 3 });
    const second = new EmaCrossStrategy("ETHUSDT", { shortPeriod: 2, longPeriod: 3 });
    first.update(100); first.update(90);
    expect(first.snapshot().observations).toBe(2);
    expect(second.snapshot().observations).toBe(0);
    first.reset();
    expect(first.snapshot().observations).toBe(0);
  });

  it("rejects invalid EMA periods", () => {
    expect(() => new EmaCrossStrategy("BTCUSDT", { shortPeriod: 0, longPeriod: 1 })).toThrow();
    expect(() => new EmaCrossStrategy("BTCUSDT", { shortPeriod: 10, longPeriod: 5 })).toThrow();
  });
});

describe("PERCENT_CYCLE", () => {
  it("distinguishes pending and filled order states", () => {
    const strategy = new PercentCycleStrategy({ symbol: "BTCUSDT", capitalUSDT: 100, maxCapitalUSDT: 100, sellRisePct: 2, rebuyDropPct: 1 });
    expect(strategy.evaluate(100).kind).toBe("BUY");
    strategy.markOrderPending("BUY");
    expect(strategy.snapshot().status).toBe("BUY_ORDER_PENDING");
    strategy.markFilled("BUY", 100);
    expect(strategy.evaluate(102).kind).toBe("SELL");
    strategy.markOrderPending("SELL");
    strategy.markFilled("SELL", 102);
    expect(strategy.evaluate(100.9).kind).toBe("BUY");
  });
});
