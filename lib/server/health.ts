import { getTradingMode, getWorkerConfig } from "./env";
import { getTestnetCredentialSummary, validateStoredTestnetCredentials } from "./exchangeCredentials";
import { prisma } from "./prisma";
import { redactSensitive } from "./redact";

export type HealthState = "HEALTHY" | "DEGRADED" | "UNHEALTHY";
export interface HealthResult {
  state: HealthState;
  checkedAt: string;
  message: string;
  details?: Record<string, string | number | boolean | null>;
}

const checkedAt = () => new Date().toISOString();

export async function databaseHealth(): Promise<HealthResult> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { state: "HEALTHY", checkedAt: checkedAt(), message: "PostgreSQL connected" };
  } catch {
    return { state: "UNHEALTHY", checkedAt: checkedAt(), message: "PostgreSQL unavailable" };
  }
}

export async function workerHealth(): Promise<HealthResult> {
  try {
    const heartbeat = await prisma.workerHeartbeat.findUnique({ where: { id: "primary" } });
    if (!heartbeat) return { state: "UNHEALTHY", checkedAt: checkedAt(), message: "Worker has not registered a heartbeat" };
    const ageMs = Date.now() - heartbeat.lastHeartbeatAt.getTime();
    const healthyWindow = Math.max(getWorkerConfig().pollMs * 3, 15_000);
    const state: HealthState = ageMs <= healthyWindow ? "HEALTHY" : ageMs <= 120_000 ? "DEGRADED" : "UNHEALTHY";
    return {
      state,
      checkedAt: checkedAt(),
      message: state === "HEALTHY" ? "Worker heartbeat is current" : "Worker heartbeat is stale",
      details: {
        heartbeatAgeMs: ageMs,
        lastHeartbeatAt: heartbeat.lastHeartbeatAt.toISOString(),
        lastReconciliationAt: heartbeat.lastReconciliationAt?.toISOString() ?? null,
        lastError: heartbeat.lastError ? redactSensitive(heartbeat.lastError) : null,
      },
    };
  } catch {
    return { state: "UNHEALTHY", checkedAt: checkedAt(), message: "Worker health unavailable because PostgreSQL is unavailable" };
  }
}

export async function binanceHealth(symbol = "BTCUSDT"): Promise<HealthResult> {
  if (getTradingMode() !== "TESTNET") {
    return { state: "DEGRADED", checkedAt: checkedAt(), message: "TRADING_MODE is SIM; Binance Testnet is intentionally disabled" };
  }
  try {
    const summary = await getTestnetCredentialSummary();
    if (!summary.configured || !summary.enabled) {
      return { state: "UNHEALTHY", checkedAt: checkedAt(), message: "Binance Spot Testnet credentials are not validated" };
    }
    const result = await validateStoredTestnetCredentials(symbol);
    return {
      state: "HEALTHY",
      checkedAt: checkedAt(),
      message: "Binance Spot Testnet read-only validation passed",
      details: {
        symbol: result.symbol.symbol,
        spotAllowed: result.symbol.spotAllowed,
        nonZeroBalanceCount: result.nonZeroBalanceCount,
        openOrderCount: result.openOrderCount,
        serverTime: new Date(result.serverTime).toISOString(),
      },
    };
  } catch {
    return { state: "UNHEALTHY", checkedAt: checkedAt(), message: "Binance Spot Testnet read-only validation failed" };
  }
}

export async function applicationHealth(): Promise<HealthResult> {
  try {
    const latestPrice = await prisma.botRuntime.findFirst({ where: { lastPrice: { not: null } }, orderBy: { updatedAt: "desc" } });
    return {
      state: "HEALTHY",
      checkedAt: checkedAt(),
      message: "RadarCrypto API is running",
      details: { lastPriceAgeMs: latestPrice ? Date.now() - latestPrice.updatedAt.getTime() : null },
    };
  } catch {
    return { state: "DEGRADED", checkedAt: checkedAt(), message: "RadarCrypto API is running without database telemetry" };
  }
}

export async function aggregateHealth(symbol = "BTCUSDT") {
  const [application, database, worker, binance] = await Promise.all([
    applicationHealth(), databaseHealth(), workerHealth(), binanceHealth(symbol),
  ]);
  const states = [application.state, database.state, worker.state, binance.state];
  const overall: HealthState = states.includes("UNHEALTHY") ? "UNHEALTHY" : states.includes("DEGRADED") ? "DEGRADED" : "HEALTHY";
  return { overall, application, database, worker, binance };
}
