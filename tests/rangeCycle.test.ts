import { describe, expect, it } from "vitest";
import type { SymbolInfo } from "@/lib/trading/domain";
import { decideRangeAction, nextLevelStateAfterFill, STRATEGY_B_START_AUTHORIZATION, validateRangeConfiguration, type RangeConfigInput } from "@/lib/trading/rangeCycle";
import { EmaCrossStrategy } from "@/lib/trading/strategies/emaCross";
import { EmaCrossA2Strategy } from "@/lib/trading/strategies/emaCrossA2";
import { EmaCrossA21Strategy } from "@/lib/trading/strategies/emaCrossA21";

const symbol: SymbolInfo = { symbol: "BTCUSDT", status: "TRADING", baseAsset: "BTC", quoteAsset: "USDT", spotAllowed: true, filter: { minPrice: 0.01, maxPrice: 1_000_000, tickSize: 0.01, minQuantity: 0.00001, maxQuantity: 100, stepSize: 0.00001, minNotional: 5 } };
const config = (overrides: Partial<RangeConfigInput> = {}): RangeConfigInput => ({ mode: "READY", name: "B", symbol: "BTCUSDT", capitalTotal: 100, maxCommitted: 60, maxExposure: 60, structuralStop: 59000, simulatedMakerFeeBps: 10, simulatedSlippageBps: 5, costWarningAccepted: false, levels: [{ levelNumber: 1, entryPrice: 63600, targetPrice: 64200, quoteAmount: 20, enabled: true, repeat: true }], ...overrides });

describe("Strategy B configuration", () => {
  it("validates a single level and Binance filters", () => expect(validateRangeConfiguration(config(), symbol).valid).toBe(true));
  it("validates multiple independent levels", () => expect(validateRangeConfiguration(config({ levels: [config().levels[0], { levelNumber: 2, entryPrice: 63500, targetPrice: 64300, quoteAmount: 20, enabled: true, repeat: true }] }), symbol).valid).toBe(true));
  it("rejects a nonexistent/mismatched or inactive pair", () => {
    expect(validateRangeConfiguration(config({ symbol: "NOPEUSDT" }), symbol).errors).toContain("SYMBOL_MISMATCH");
    expect(validateRangeConfiguration(config(), { ...symbol, status: "BREAK" }).errors).toContain("SYMBOL_NOT_ACTIVE_FOR_SPOT");
  });
  it("rejects invalid Binance tick, quantity and notional filters", () => {
    const result = validateRangeConfiguration(config({ levels: [{ levelNumber: 1, entryPrice: 63600.001, targetPrice: 64200.001, quoteAmount: 1, enabled: true, repeat: true }] }), symbol);
    expect(result.errors).toEqual(expect.arrayContaining(["LEVEL_1_ENTRY_TICK_SIZE", "LEVEL_1_TARGET_TICK_SIZE", "LEVEL_1_MIN_NOTIONAL"]));
  });
  it("blocks invalid structural stop and insufficient capital", () => {
    expect(validateRangeConfiguration(config({ structuralStop: 64000 }), symbol).errors).toContain("STRUCTURAL_STOP_MUST_BE_BELOW_ALL_ENTRIES");
    expect(validateRangeConfiguration(config({ maxCommitted: 10 }), symbol).errors).toContain("LEVEL_SUM_EXCEEDS_MAX_COMMITTED");
  });
  it("warns and requires confirmation when target is below simulated costs", () => {
    const low = config({ levels: [{ levelNumber: 1, entryPrice: 63600, targetPrice: 63601, quoteAmount: 20, enabled: true, repeat: true }] });
    expect(validateRangeConfiguration(low, symbol).errors).toContain("COST_WARNING_CONFIRMATION_REQUIRED");
    expect(validateRangeConfiguration({ ...low, costWarningAccepted: true }, symbol).valid).toBe(true);
  });
  it("supports the simple custom mode", () => expect(validateRangeConfiguration(config({ mode: "CUSTOM" }), symbol).valid).toBe(true));
});

describe("Strategy B state machine", () => {
  const waitingBuy = { id: "l1", levelNumber: 1, state: "WAITING_BUY" as const, entryPrice: 63600, targetPrice: 64200, quoteAmount: 20, repeat: true, heldQuantity: 0 };
  it("creates a LIMIT buy decision for the waiting level", () => expect(decideRangeAction(65000, 59000, [waitingBuy])).toMatchObject({ kind: "BUY", limitPrice: 63600 }));
  it("sells only a filled level at its own target while another waits", () => {
    const result = decideRangeAction(64200, 59000, [waitingBuy, { ...waitingBuy, id: "l2", levelNumber: 2, state: "WAITING_SELL", heldQuantity: 0.0003, activeCycleId: "c2" }]);
    expect(result).toMatchObject({ kind: "SELL", levelId: "l2", cycleId: "c2", structuralStop: false });
  });
  it("supports two independently triggered entries across locked worker cycles", () => {
    expect(decideRangeAction(65000, 59000, [waitingBuy, { ...waitingBuy, id: "l2", levelNumber: 2, entryPrice: 63500 }])).toMatchObject({ kind: "BUY", levelId: "l1" });
    expect(decideRangeAction(65000, 59000, [{ ...waitingBuy, state: "BUY_PENDING" }, { ...waitingBuy, id: "l2", levelNumber: 2, entryPrice: 63500 }])).toMatchObject({ kind: "BUY", levelId: "l2" });
  });
  it("uses the exact structural stop, never EMA", () => expect(decideRangeAction(58999, 59000, [{ ...waitingBuy, state: "WAITING_SELL", heldQuantity: 0.0003, activeCycleId: "c1" }])).toMatchObject({ kind: "SELL", limitPrice: 59000, structuralStop: true }));
  it("restarts or completes a cycle according to repeat", () => { expect(nextLevelStateAfterFill("SELL", true)).toBe("WAITING_BUY"); expect(nextLevelStateAfterFill("SELL", false)).toBe("COMPLETED"); });
  it("exposes a dedicated authorization phrase", () => expect(STRATEGY_B_START_AUTHORIZATION).toBe("I_AUTHORIZE_BINANCE_SPOT_TESTNET_STRATEGY_B_START"));
  it("keeps EMA A/A2/A2.1 constructors available without modification", () => {
    expect(new EmaCrossStrategy("BTCUSDT", { shortPeriod: 9, longPeriod: 21 })).toBeDefined();
    expect(new EmaCrossA2Strategy("BTCUSDT", { shortPeriod: 9, longPeriod: 21, rollingRangeWindow: 21, minExpectedEdgeBps: 0, minEmaSeparationBps: 0, minRollingRangeBps: 0, simulatedEntryFeeBps: 0, simulatedExitFeeBps: 0, simulatedEntrySlippageBps: 0, simulatedExitSlippageBps: 0 })).toBeDefined();
    expect(new EmaCrossA21Strategy("BTCUSDT", { shortPeriod: 9, longPeriod: 21, samplingIntervalMs: 5000, minExpectedEdgeBps: 0, minEmaSeparationBps: 0, minRange5mBps: 0, minRange15mBps: 0, realisticEntryFeeBps: 0, realisticExitFeeBps: 0, realisticEntrySlippageBps: 0, realisticExitSlippageBps: 0, stressEntryFeeBps: 0, stressExitFeeBps: 0, stressEntrySlippageBps: 0, stressExitSlippageBps: 0 })).toBeDefined();
  });
});
