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
