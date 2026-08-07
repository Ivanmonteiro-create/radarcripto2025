export const AUTONOMOUS_TEST_AUTHORIZATION = "I_AUTHORIZE_BINANCE_SPOT_TESTNET_AUTONOMOUS_TEST";
export const MIN_TEST_DURATION_MINUTES = 5;
export const MAX_TEST_DURATION_MINUTES = 7 * 24 * 60;

export type TimedTestStatus = "IN_PROGRESS" | "COMPLETED" | "INTERRUPTED" | "ERROR";
export type TestSignal = "BUY" | "SELL" | "HOLD";

export interface TestDecisionMetrics {
  observations: number;
  crossoverCount: number;
  buySignals: number;
  sellSignals: number;
  holdSignals: number;
}

export function resolveTestWindow(durationMinutes: number, now = new Date()) {
  if (!Number.isInteger(durationMinutes)
    || durationMinutes < MIN_TEST_DURATION_MINUTES
    || durationMinutes > MAX_TEST_DURATION_MINUTES) {
    throw new Error("TEST_DURATION_OUT_OF_RANGE");
  }
  const requestedDurationMs = durationMinutes * 60_000;
  return {
    testStartedAt: new Date(now),
    testEndsAt: new Date(now.getTime() + requestedDurationMs),
    requestedDurationMs,
  };
}

export function testAcceptsNewEntries(
  test: { status: TimedTestStatus; testEndsAt: Date; stopRequestedAt?: Date | null },
  now = new Date(),
): boolean {
  return test.status === "IN_PROGRESS" && !test.stopRequestedAt && now.getTime() < test.testEndsAt.getTime();
}

export function addDecision(
  metrics: TestDecisionMetrics,
  signal: TestSignal,
): TestDecisionMetrics {
  return {
    observations: metrics.observations + 1,
    crossoverCount: metrics.crossoverCount + (signal === "HOLD" ? 0 : 1),
    buySignals: metrics.buySignals + (signal === "BUY" ? 1 : 0),
    sellSignals: metrics.sellSignals + (signal === "SELL" ? 1 : 0),
    holdSignals: metrics.holdSignals + (signal === "HOLD" ? 1 : 0),
  };
}

export function finalStatusForReason(reason: string): Exclude<TimedTestStatus, "IN_PROGRESS"> {
  if (reason === "DURATION_COMPLETED") return "COMPLETED";
  if (reason === "BOT_ERROR" || reason === "WORKER_ERROR" || reason === "STATE_INCONSISTENCY") return "ERROR";
  return "INTERRUPTED";
}

export function calculateDrawdown(peakEquity: number, equity: number): number {
  if (!Number.isFinite(peakEquity) || peakEquity <= 0 || !Number.isFinite(equity)) return 0;
  return Math.max(0, ((peakEquity - equity) / peakEquity) * 100);
}

export interface TestSummaryInput {
  testStartedAt: Date;
  completedAt: Date;
  observations: number;
  crossoverCount: number;
  buySignals: number;
  sellSignals: number;
  holdSignals: number;
  buyExecuted: number;
  buyBlocked: number;
  sellExecuted: number;
  sellIgnored: number;
  orderCount: number;
  fillCount: number;
  realizedPnl: number;
  unrealizedPnl: number;
  initialEquity: number;
  finalEquity: number;
  maxDrawdownPct: number;
  cooldownBlocks: number;
  riskEventCount: number;
  errorCount: number;
  finalPosition: unknown;
  stopReason: string;
}

export function buildTestSummary(input: TestSummaryInput) {
  return {
    actualDurationMs: Math.max(0, input.completedAt.getTime() - input.testStartedAt.getTime()),
    observations: input.observations,
    crossovers: input.crossoverCount,
    buy: input.buySignals,
    sell: input.sellSignals,
    hold: input.holdSignals,
    buyExecuted: input.buyExecuted,
    buyBlocked: input.buyBlocked,
    sellExecuted: input.sellExecuted,
    sellIgnored: input.sellIgnored,
    orders: input.orderCount,
    fills: input.fillCount,
    realizedPnl: input.realizedPnl,
    finalPnl: input.realizedPnl + input.unrealizedPnl,
    initialEquity: input.initialEquity,
    finalEquity: input.finalEquity,
    maxDrawdownPct: input.maxDrawdownPct,
    cooldownBlocks: input.cooldownBlocks,
    riskEvents: input.riskEventCount,
    errors: input.errorCount,
    finalPosition: input.finalPosition,
    stopReason: input.stopReason,
  };
}
