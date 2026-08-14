import type { StrategySignal } from "../domain";
import { EmaCrossStrategy, type EmaCrossState } from "./emaCross";

export type EmaCrossA2Config = {
  shortPeriod: number;
  longPeriod: number;
  rollingRangeWindow: number;
  minExpectedEdgeBps: number;
  minEmaSeparationBps: number;
  minRollingRangeBps: number;
  simulatedEntryFeeBps: number;
  simulatedExitFeeBps: number;
  simulatedEntrySlippageBps: number;
  simulatedExitSlippageBps: number;
};

export const DEFAULT_EMA_A2_THRESHOLDS = {
  rollingRangeWindow: 21,
  minExpectedEdgeBps: 5,
  minEmaSeparationBps: 0.5,
  minRollingRangeBps: 20,
} as const;

export type EmaCrossA2State = {
  ema: EmaCrossState;
  prices: number[];
  pendingCrossover?: "BUY" | "SELL";
  latestTelemetry?: EmaCrossA2Telemetry;
};

export type EmaCrossA2Telemetry = {
  emaShort: number;
  emaLong: number;
  emaSeparationBps: number;
  rollingRangeWindow: number;
  rollingMinPrice: number;
  rollingMaxPrice: number;
  rollingRangeBps: number;
  expectedMoveBps: number;
  estimatedCostBps: number;
  requiredEdgeBps: number;
  crossoverDetected: boolean;
  crossoverConfirmed: boolean;
  rawSignalKind: "BUY" | "SELL" | "HOLD";
};

function assertNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be non-negative`);
}

export class EmaCrossA2Strategy {
  private readonly baseline: EmaCrossStrategy;
  private state: EmaCrossA2State = { ema: { observations: 0 }, prices: [] };

  constructor(private readonly symbol: string, private readonly config: EmaCrossA2Config) {
    this.baseline = new EmaCrossStrategy(symbol, config);
    if (!Number.isInteger(config.rollingRangeWindow) || config.rollingRangeWindow < config.longPeriod) {
      throw new Error("rollingRangeWindow must be an integer at least as large as longPeriod");
    }
    assertNonNegative("minExpectedEdgeBps", config.minExpectedEdgeBps);
    assertNonNegative("minEmaSeparationBps", config.minEmaSeparationBps);
    assertNonNegative("minRollingRangeBps", config.minRollingRangeBps);
    assertNonNegative("simulatedEntryFeeBps", config.simulatedEntryFeeBps);
    assertNonNegative("simulatedExitFeeBps", config.simulatedExitFeeBps);
    assertNonNegative("simulatedEntrySlippageBps", config.simulatedEntrySlippageBps);
    assertNonNegative("simulatedExitSlippageBps", config.simulatedExitSlippageBps);
  }

  update(price: number, timestamp = Date.now()): StrategySignal {
    const raw = this.baseline.update(price, timestamp);
    const ema = this.baseline.snapshot();
    this.state.ema = ema;
    this.state.prices = [...this.state.prices, price].slice(-this.config.rollingRangeWindow);
    const emaShort = ema.shortEma ?? price;
    const emaLong = ema.longEma ?? price;
    const difference = emaShort - emaLong;
    const emaSeparationBps = Math.abs(difference) / price * 10_000;
    const rollingMinPrice = Math.min(...this.state.prices);
    const rollingMaxPrice = Math.max(...this.state.prices);
    const rollingRangeBps = (rollingMaxPrice - rollingMinPrice) / price * 10_000;
    const estimatedCostBps = this.config.simulatedEntryFeeBps
      + this.config.simulatedExitFeeBps
      + this.config.simulatedEntrySlippageBps
      + this.config.simulatedExitSlippageBps;
    const requiredEdgeBps = estimatedCostBps + this.config.minExpectedEdgeBps;
    // Reproducible proxy: recent observed high-low amplitude over ticker snapshots.
    // It is deliberately not called a forecast or ATR.
    const expectedMoveBps = rollingRangeBps;
    const crossoverKind = raw.kind === "BUY" || raw.kind === "SELL" ? raw.kind : null;
    const crossoverDetected = crossoverKind !== null;
    if (crossoverKind) this.state.pendingCrossover = crossoverKind;

    let candidate: "BUY" | "SELL" | null = null;
    const pending = this.state.pendingCrossover;
    const directionStillValid = pending === "BUY" ? difference > 0 : pending === "SELL" ? difference < 0 : false;
    if (pending && directionStillValid && emaSeparationBps >= this.config.minEmaSeparationBps) {
      candidate = pending;
      this.state.pendingCrossover = undefined;
    }
    const telemetry: EmaCrossA2Telemetry = {
      emaShort, emaLong, emaSeparationBps, rollingRangeWindow: this.config.rollingRangeWindow,
      rollingMinPrice, rollingMaxPrice, rollingRangeBps, expectedMoveBps, estimatedCostBps,
      requiredEdgeBps, crossoverDetected, crossoverConfirmed: candidate !== null, rawSignalKind: raw.kind,
    };
    this.state.latestTelemetry = telemetry;

    if (crossoverKind && !candidate) {
      return this.filtered("MICRO_CROSSOVER_FILTERED", crossoverKind, "EMA crossover awaiting minimum separation", telemetry, timestamp);
    }
    if (!candidate) return this.signal("HOLD", "No confirmed EMA A2 crossover", telemetry, timestamp);
    if (candidate === "BUY" && this.state.prices.length < this.config.rollingRangeWindow) {
      return this.filtered("INSUFFICIENT_MARKET_RANGE", candidate, "Rolling range window is not warm", telemetry, timestamp);
    }
    if (candidate === "BUY" && rollingRangeBps < this.config.minRollingRangeBps) {
      return this.filtered("INSUFFICIENT_MARKET_RANGE", candidate, "Rolling ticker range is below threshold", telemetry, timestamp);
    }
    if (candidate === "BUY" && expectedMoveBps <= requiredEdgeBps) {
      return this.filtered("INSUFFICIENT_EXPECTED_EDGE", candidate, "Observed rolling range does not cover simulated round-trip costs and minimum edge", telemetry, timestamp);
    }
    return this.signal(candidate, `EMA 9/21 A2 ${candidate} crossover confirmed`, telemetry, timestamp);
  }

  snapshot(): EmaCrossA2State {
    return { ...this.state, ema: { ...this.state.ema }, prices: [...this.state.prices] };
  }

  restore(state: EmaCrossA2State): void {
    this.baseline.restore(state.ema);
    this.state = { ...state, ema: { ...state.ema }, prices: [...state.prices].slice(-this.config.rollingRangeWindow) };
  }

  private filtered(
    code: "MICRO_CROSSOVER_FILTERED" | "INSUFFICIENT_MARKET_RANGE" | "INSUFFICIENT_EXPECTED_EDGE",
    rawSignalKind: "BUY" | "SELL",
    reason: string,
    telemetry: EmaCrossA2Telemetry,
    timestamp: number,
  ): StrategySignal {
    return this.signal("HOLD", reason, telemetry, timestamp, { filterCode: code, filteredSignalKind: rawSignalKind });
  }

  private signal(
    kind: StrategySignal["kind"],
    reason: string,
    telemetry: EmaCrossA2Telemetry,
    timestamp: number,
    extra: Record<string, string> = {},
  ): StrategySignal {
    return { kind, symbol: this.symbol, strategy: "EMA_CROSS", reason, timestamp, metadata: { variant: "A2", ...telemetry, ...extra } };
  }
}
