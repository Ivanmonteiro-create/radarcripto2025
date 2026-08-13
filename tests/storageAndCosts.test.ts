import { afterEach, describe, expect, it, vi } from "vitest";
import { balancesEqual, intervalElapsed, relevantAssets, retentionCutoff, selectRelevantBalances, shouldPersistSnapshot } from "@/lib/trading/balanceSnapshotPolicy";
import { calculateExecutionCosts } from "@/lib/trading/executionCosts";
import { calculateStorageMetrics, calculateTestFinancialMetrics } from "@/lib/trading/testFinancialMetrics";
import { currentEquityValue } from "@/lib/trading/timedTest";
import { getBalanceSnapshotConfig, getWorkerConfig } from "@/lib/server/env";

const costModel = {
  enabled: true,
  realisticTakerFeeBps: 2,
  realisticSlippageBps: 1,
  simulatedMakerFeeBps: 5,
  simulatedTakerFeeBps: 10,
  simulatedSlippageBps: 5,
};
afterEach(() => vi.unstubAllEnvs());

describe("balance snapshot policy", () => {
  it("selects only BTC and USDT from hundreds of faucet assets", () => {
    const balances = Array.from({ length: 504 }, (_, index) => ({ asset: `FAUCET${index}`, free: 1, locked: 0 }));
    balances.push({ asset: "BTC", free: 0.001, locked: 0 }, { asset: "USDT", free: 10, locked: 2 });
    expect(relevantAssets("BTCUSDT")).toEqual(["BTC", "USDT"]);
    expect(selectRelevantBalances(balances, "BTCUSDT")).toEqual([
      { asset: "BTC", free: 0.001, locked: 0 }, { asset: "USDT", free: 10, locked: 2 },
    ]);
  });

  it("respects 60 seconds, detects duplicates, and keeps retention read-only", () => {
    const now = new Date("2026-08-09T12:01:00Z");
    expect(intervalElapsed(new Date("2026-08-09T12:00:01Z"), now, 60)).toBe(false);
    expect(intervalElapsed(new Date("2026-08-09T12:00:00Z"), now, 60)).toBe(true);
    expect(balancesEqual([{ asset: "BTC", free: 1, locked: 0 }], [{ asset: "BTC", free: 1, locked: 0 }])).toBe(true);
    expect(retentionCutoff(30, now)).toEqual(new Date("2026-07-10T12:01:00Z"));
  });

  it("persists an immediate fill snapshot only when balances changed", () => {
    expect(shouldPersistSnapshot({ reason: "FILL", intervalHasElapsed: false, balancesChanged: true, hasPrevious: true })).toBe(true);
    expect(shouldPersistSnapshot({ reason: "FILL", intervalHasElapsed: false, balancesChanged: false, hasPrevious: true })).toBe(false);
  });

  it("projects 2 relevant rows per minute independently from the 5-second heartbeat", () => {
    vi.stubEnv("BOT_WORKER_POLL_MS", "5000");
    vi.stubEnv("BALANCE_SNAPSHOT_INTERVAL_SEC", "60");
    const storage = calculateStorageMetrics(2 * 60 * 24, 86_400_000);
    expect(storage.estimatedRowsPerDay).toBe(2_880);
    expect(getWorkerConfig().pollMs).toBe(5_000);
    expect(getBalanceSnapshotConfig().intervalSec).toBe(60);
  });
});

describe("execution costs and reporting", () => {
  it("calculates BUY and SELL slippage in the adverse direction", () => {
    const buy = calculateExecutionCosts({ side: "BUY", type: "MARKET", decisionPrice: 100, averageFillPrice: 101, quantity: 2, exchangeFeeActual: 0.2, costModel });
    const sell = calculateExecutionCosts({ side: "SELL", type: "MARKET", decisionPrice: 100, averageFillPrice: 99, quantity: 2, exchangeFeeActual: 0.2, costModel });
    expect(buy.slippageQuote).toBe(2);
    expect(sell.slippageQuote).toBe(2);
    expect(buy.slippageBps).toBe(100);
    expect(sell.slippageBps).toBe(100);
    expect(buy.exchangeFeeActual).toBe(0.2);
    expect(buy.realisticFee).toBeCloseTo(0.0404);
    expect(buy.realisticSlippage).toBeCloseTo(0.0202);
    expect(buy.simulatedFee).toBe(0.2);
  });

  it("keeps old nullable history readable and computes real strategy metrics", () => {
    const metrics = calculateTestFinancialMetrics([{
      orderId: "old", side: "SELL", grossPnl: null, actualNetPnl: null, simulatedNetPnl: null,
      exchangeFeeActual: null, simulatedFee: null, actualSlippage: null, simulatedSlippage: null,
      decisionReason: null,
    }]);
    expect(metrics.finance).toMatchObject({ grossPnl: 0, actualNetPnl: 0, simulatedNetPnl: 0 });
    expect(metrics.strategy.closedTrades).toBe(1);
    expect(metrics.strategyRealistic.closedTrades).toBe(1);
  });

  it("reports realistic and stress results independently", () => {
    const metrics = calculateTestFinancialMetrics([{
      orderId: "sell-1", side: "SELL", grossPnl: 0.2, actualNetPnl: 0.19,
      realisticNetPnl: 0.14, simulatedNetPnl: 0.02, exchangeFeeActual: 0.01,
      realisticFee: 0.02, realisticSlippage: 0.04, simulatedFee: 0.1,
      actualSlippage: 0, simulatedSlippage: 0.08, totalRealisticCost: 0.06,
      totalSimulatedCost: 0.18,
    }]);
    expect(metrics.finance.realisticNetPnl).toBeCloseTo(0.14);
    expect(metrics.finance.simulatedNetPnl).toBeCloseTo(0.02);
    expect(metrics.strategyRealistic.expectancy).toBeCloseTo(0.14);
    expect(metrics.strategyStress.expectancy).toBeCloseTo(0.02);
  });

  it("shows current equity separately from peak equity", () => {
    expect(currentEquityValue({ initialEquity: 10, realizedPnl: -0.1, unrealizedPnl: 0.02 })).toBeCloseTo(9.92);
    expect(currentEquityValue({ currentEquity: 9.92, finalEquity: null, initialEquity: 10, realizedPnl: 0, unrealizedPnl: 0 })).not.toBe(10.4);
  });
});
