import { z } from "zod";

const tradingModeSchema = z.enum(["SIM", "TESTNET"]);

export function getTradingMode(): "SIM" | "TESTNET" {
  const parsed = tradingModeSchema.safeParse(process.env.TRADING_MODE ?? "SIM");
  if (!parsed.success) throw new Error("TRADING_MODE must be SIM or TESTNET");
  return parsed.data;
}

export function getWorkerConfig() {
  const enabled = process.env.BOT_WORKER_ENABLED === "true";
  const pollMs = Number(process.env.BOT_WORKER_POLL_MS ?? 5_000);
  const retryLimit = Number(process.env.BOT_WORKER_RETRY_LIMIT ?? 5);
  const maxBackoffMs = Number(process.env.BOT_WORKER_MAX_BACKOFF_MS ?? 60_000);
  if (!Number.isFinite(pollMs) || pollMs < 1_000) throw new Error("BOT_WORKER_POLL_MS must be at least 1000");
  if (!Number.isInteger(retryLimit) || retryLimit < 1 || retryLimit > 20) throw new Error("BOT_WORKER_RETRY_LIMIT must be between 1 and 20");
  if (!Number.isFinite(maxBackoffMs) || maxBackoffMs < pollMs) throw new Error("BOT_WORKER_MAX_BACKOFF_MS must be at least BOT_WORKER_POLL_MS");
  return { enabled, pollMs, retryLimit, maxBackoffMs };
}

function nonNegativeNumber(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative number`);
  return value;
}

export function getBalanceSnapshotConfig() {
  const intervalSec = nonNegativeNumber("BALANCE_SNAPSHOT_INTERVAL_SEC", 60);
  const retentionDays = nonNegativeNumber("BALANCE_SNAPSHOT_RETENTION_DAYS", 30);
  if (intervalSec < 1) throw new Error("BALANCE_SNAPSHOT_INTERVAL_SEC must be at least 1");
  if (retentionDays < 1) throw new Error("BALANCE_SNAPSHOT_RETENTION_DAYS must be at least 1");
  return { intervalSec, retentionDays };
}

export function getCostModelConfig() {
  const enabled = (process.env.COST_MODEL_ENABLED ?? "true") === "true";
  return {
    enabled,
    // Configurable Testnet laboratory assumptions. They never replace exchange-reported fees.
    realisticTakerFeeBps: nonNegativeNumber("REALISTIC_TAKER_FEE_BPS", 2),
    realisticSlippageBps: nonNegativeNumber("REALISTIC_SLIPPAGE_BPS_PER_SIDE", 1),
    simulatedMakerFeeBps: nonNegativeNumber("SIMULATED_MAKER_FEE_BPS", 10),
    simulatedTakerFeeBps: nonNegativeNumber("SIMULATED_TAKER_FEE_BPS", 10),
    simulatedSlippageBps: nonNegativeNumber("SIMULATED_SLIPPAGE_BPS", 5),
  };
}

export function getEmaA21ThresholdConfig() {
  return {
    minExpectedEdgeBps: nonNegativeNumber("A21_MIN_EXPECTED_EDGE_BPS", 0),
    minEmaSeparationBps: nonNegativeNumber("A21_MIN_EMA_SEPARATION_BPS", 0.1),
    minRange5mBps: nonNegativeNumber("A21_MIN_RANGE_5M_BPS", 3),
    minRange15mBps: nonNegativeNumber("A21_MIN_RANGE_15M_BPS", 6),
  };
}

export function getEmaA2ThresholdConfig() {
  const rollingRangeWindow = nonNegativeNumber("ROLLING_RANGE_WINDOW", 21);
  if (!Number.isInteger(rollingRangeWindow) || rollingRangeWindow < 21) {
    throw new Error("ROLLING_RANGE_WINDOW must be an integer of at least 21");
  }
  return {
    minExpectedEdgeBps: nonNegativeNumber("MIN_EXPECTED_EDGE_BPS", 5),
    minEmaSeparationBps: nonNegativeNumber("MIN_EMA_SEPARATION_BPS", 0.5),
    minRollingRangeBps: nonNegativeNumber("MIN_ROLLING_RANGE_BPS", 20),
    rollingRangeWindow,
  };
}

export function getBinanceTestnetConfig() {
  if (getTradingMode() !== "TESTNET") throw new Error("Binance Testnet adapter requires TRADING_MODE=TESTNET");
  const apiKey = process.env.BINANCE_TESTNET_API_KEY;
  const apiSecret = process.env.BINANCE_TESTNET_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error("Binance Testnet credentials are not configured");
  return {
    apiKey,
    apiSecret,
    baseUrl: process.env.BINANCE_TESTNET_BASE_URL || "https://testnet.binance.vision",
  };
}
