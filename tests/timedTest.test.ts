import { describe, expect, it } from "vitest";
import {
  addDecision,
  buildTestSummary,
  calculateDrawdown,
  finalStatusForReason,
  resolveTestWindow,
  testAcceptsNewEntries,
} from "../lib/trading/timedTest";

describe("autonomous timed bot tests", () => {
  const startedAt = new Date("2026-08-07T10:00:00.000Z");

  it("creates and persists an exact 24-hour window", () => {
    const window = resolveTestWindow(24 * 60, startedAt);
    const persisted = JSON.parse(JSON.stringify(window));
    expect(new Date(persisted.testStartedAt)).toEqual(startedAt);
    expect(new Date(persisted.testEndsAt)).toEqual(new Date("2026-08-08T10:00:00.000Z"));
    expect(persisted.requestedDurationMs).toBe(86_400_000);
  });

  it("does not depend on browser memory", () => {
    const persisted = JSON.stringify({ status: "IN_PROGRESS", ...resolveTestWindow(60, startedAt), stopRequestedAt: null });
    const restored = JSON.parse(persisted) as { status: "IN_PROGRESS"; testEndsAt: string; stopRequestedAt: null };
    expect(testAcceptsNewEntries({ ...restored, testEndsAt: new Date(restored.testEndsAt) }, new Date("2026-08-07T10:59:59Z"))).toBe(true);
  });

  it("preserves the deadline across worker restart", () => {
    const saved = resolveTestWindow(60, startedAt);
    const restartedAt = new Date("2026-08-07T10:40:00Z");
    expect(testAcceptsNewEntries({ status: "IN_PROGRESS", testEndsAt: saved.testEndsAt }, restartedAt)).toBe(true);
    expect(saved.testEndsAt).toEqual(new Date("2026-08-07T11:00:00Z"));
  });

  it("blocks every new entry at and after the persisted deadline", () => {
    const { testEndsAt } = resolveTestWindow(60, startedAt);
    const test = { status: "IN_PROGRESS" as const, testEndsAt };
    expect(testAcceptsNewEntries(test, new Date(testEndsAt.getTime() - 1))).toBe(true);
    expect(testAcceptsNewEntries(test, testEndsAt)).toBe(false);
    expect(testAcceptsNewEntries(test, new Date(testEndsAt.getTime() + 1))).toBe(false);
  });

  it("blocks entries immediately after a stop request", () => {
    const { testEndsAt } = resolveTestWindow(60, startedAt);
    expect(testAcceptsNewEntries({ status: "IN_PROGRESS", testEndsAt, stopRequestedAt: new Date() }, startedAt)).toBe(false);
  });

  it("persists decision metrics that survive a panel refresh", () => {
    let metrics = { observations: 0, crossoverCount: 0, buySignals: 0, sellSignals: 0, holdSignals: 0 };
    metrics = addDecision(metrics, "HOLD");
    metrics = addDecision(metrics, "BUY");
    metrics = addDecision(metrics, "SELL");
    expect(JSON.parse(JSON.stringify(metrics))).toEqual({ observations: 3, crossoverCount: 2, buySignals: 1, sellSignals: 1, holdSignals: 1 });
  });

  it("builds the same immutable final summary exactly once", () => {
    const input = {
      testStartedAt: startedAt, completedAt: new Date("2026-08-07T11:00:00Z"), observations: 720,
      crossoverCount: 2, buySignals: 1, sellSignals: 1, holdSignals: 718,
      buyExecuted: 1, buyBlocked: 0, sellExecuted: 1, sellIgnored: 0, orderCount: 2, fillCount: 2,
      realizedPnl: 0.04, unrealizedPnl: 0, initialEquity: 10, finalEquity: 10.04,
      maxDrawdownPct: 0.3, cooldownBlocks: 1, riskEventCount: 3, errorCount: 0,
      finalPosition: [], stopReason: "DURATION_COMPLETED",
    };
    const first = buildTestSummary(input);
    const retry = buildTestSummary(input);
    expect(retry).toEqual(first);
    expect(first).toMatchObject({ actualDurationMs: 3_600_000, observations: 720, orders: 2, fills: 2, finalPnl: 0.04 });
    expect(finalStatusForReason(input.stopReason)).toBe("COMPLETED");
  });

  it("calculates drawdown without creating a false negative value", () => {
    expect(calculateDrawdown(10, 10.5)).toBe(0);
    expect(calculateDrawdown(10, 9)).toBeCloseTo(10);
  });
});
