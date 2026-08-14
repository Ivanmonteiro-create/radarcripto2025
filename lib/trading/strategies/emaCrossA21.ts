import type { StrategySignal } from "../domain";
import { EmaCrossStrategy, type EmaCrossState } from "./emaCross";

const TWO_MINUTES_MS = 2 * 60_000;
const A2_LEGACY_WINDOW_MS = 105_000;
const FIVE_MINUTES_MS = 5 * 60_000;
const FIFTEEN_MINUTES_MS = 15 * 60_000;

export type EmaCrossA21Config = {
  shortPeriod: number;
  longPeriod: number;
  samplingIntervalMs: number;
  minExpectedEdgeBps: number;
  minEmaSeparationBps: number;
  minRange5mBps: number;
  minRange15mBps: number;
  realisticEntryFeeBps: number;
  realisticExitFeeBps: number;
  realisticEntrySlippageBps: number;
  realisticExitSlippageBps: number;
  stressEntryFeeBps: number;
  stressExitFeeBps: number;
  stressEntrySlippageBps: number;
  stressExitSlippageBps: number;
};

export type TickerPoint = { price: number; timestamp: number };

export type EmaCrossA21State = {
  ema: EmaCrossState;
  points: TickerPoint[];
  pendingCrossover?: "BUY" | "SELL";
  latestTelemetry?: EmaCrossA21Telemetry;
};

export type EmaCrossA21Telemetry = {
  emaShort: number;
  emaLong: number;
  emaSeparationBps: number;
  range2mBps: number;
  range5mBps: number;
  range15mBps: number;
  momentum2mBps: number;
  momentum5mBps: number;
  momentum15mBps: number;
  expectedMoveBpsA21: number;
  directionPersistenceFactor: number;
  realisticRoundTripCostBps: number;
  stressRoundTripCostBps: number;
  requiredRealisticEdgeBps: number;
  crossoverDetected: boolean;
  crossoverConfirmed: boolean;
  rawSignalKind: "BUY" | "SELL" | "HOLD";
  tickerWindowReady: boolean;
  a2LegacyRollingRangeBps: number;
  a2WouldBlock: boolean;
};

function nonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be non-negative`);
}

function windowMetrics(points: TickerPoint[], now: number, durationMs: number) {
  const window = points.filter((point) => point.timestamp >= now - durationMs);
  const prices = window.map((point) => point.price);
  const current = prices.at(-1) ?? 0;
  const first = prices[0] ?? current;
  const low = prices.length ? Math.min(...prices) : current;
  const high = prices.length ? Math.max(...prices) : current;
  return {
    rangeBps: current > 0 ? (high - low) / current * 10_000 : 0,
    momentumBps: first > 0 ? (current / first - 1) * 10_000 : 0,
  };
}

function isAligned(momentum: number, side: "BUY" | "SELL"): boolean {
  return side === "BUY" ? momentum > 0 : momentum < 0;
}

export function calculateExpectedMoveA21(input: {
  side: "BUY" | "SELL";
  range5mBps: number;
  range15mBps: number;
  momentum2mBps: number;
  momentum5mBps: number;
  momentum15mBps: number;
}) {
  const alignedWindows = [input.momentum2mBps, input.momentum5mBps, input.momentum15mBps]
    .filter((momentum) => isAligned(momentum, input.side)).length;
  const persistenceFactor = [0.4, 0.6, 0.8, 1][alignedWindows]!;
  const multiWindowRangeBps = Math.min(input.range15mBps, (input.range5mBps + input.range15mBps) / 2);
  return {
    expectedMoveBps: multiWindowRangeBps * persistenceFactor,
    persistenceFactor,
    alignedWindows,
  };
}

export class EmaCrossA21Strategy {
  private readonly baseline: EmaCrossStrategy;
  private state: EmaCrossA21State = { ema: { observations: 0 }, points: [] };

  constructor(private readonly symbol: string, private readonly config: EmaCrossA21Config) {
    this.baseline = new EmaCrossStrategy(symbol, config);
    if (!Number.isFinite(config.samplingIntervalMs) || config.samplingIntervalMs < 1_000) {
      throw new Error("samplingIntervalMs must be at least 1000");
    }
    for (const [name, value] of Object.entries(config)) {
      if (name !== "shortPeriod" && name !== "longPeriod" && name !== "samplingIntervalMs") nonNegative(name, value);
    }
  }

  update(price: number, timestamp = Date.now()): StrategySignal {
    const raw = this.baseline.update(price, timestamp);
    const ema = this.baseline.snapshot();
    this.state.ema = ema;
    this.state.points = [...this.state.points, { price, timestamp }]
      .filter((point) => point.timestamp >= timestamp - FIFTEEN_MINUTES_MS - this.config.samplingIntervalMs);

    const two = windowMetrics(this.state.points, timestamp, TWO_MINUTES_MS);
    const a2Legacy = windowMetrics(this.state.points, timestamp, A2_LEGACY_WINDOW_MS);
    const five = windowMetrics(this.state.points, timestamp, FIVE_MINUTES_MS);
    const fifteen = windowMetrics(this.state.points, timestamp, FIFTEEN_MINUTES_MS);
    const emaShort = ema.shortEma ?? price;
    const emaLong = ema.longEma ?? price;
    const difference = emaShort - emaLong;
    const emaSeparationBps = Math.abs(difference) / price * 10_000;
    const crossoverKind = raw.kind === "BUY" || raw.kind === "SELL" ? raw.kind : null;
    if (crossoverKind) this.state.pendingCrossover = crossoverKind;
    const pending = this.state.pendingCrossover;
    const directionStillValid = pending === "BUY" ? difference > 0 : pending === "SELL" ? difference < 0 : false;
    let candidate: "BUY" | "SELL" | null = null;
    if (pending && directionStillValid && emaSeparationBps >= this.config.minEmaSeparationBps) {
      candidate = pending;
      this.state.pendingCrossover = undefined;
    }
    const direction = candidate ?? pending ?? (difference >= 0 ? "BUY" : "SELL");
    const expected = calculateExpectedMoveA21({
      side: direction,
      range5mBps: five.rangeBps,
      range15mBps: fifteen.rangeBps,
      momentum2mBps: two.momentumBps,
      momentum5mBps: five.momentumBps,
      momentum15mBps: fifteen.momentumBps,
    });
    const realisticRoundTripCostBps = this.config.realisticEntryFeeBps + this.config.realisticExitFeeBps
      + this.config.realisticEntrySlippageBps + this.config.realisticExitSlippageBps;
    const stressRoundTripCostBps = this.config.stressEntryFeeBps + this.config.stressExitFeeBps
      + this.config.stressEntrySlippageBps + this.config.stressExitSlippageBps;
    const tickerWindowReady = Boolean(this.state.points[0]
      && this.state.points[0].timestamp <= timestamp - FIFTEEN_MINUTES_MS + this.config.samplingIntervalMs * 2);
    const telemetry: EmaCrossA21Telemetry = {
      emaShort, emaLong, emaSeparationBps,
      range2mBps: two.rangeBps, range5mBps: five.rangeBps, range15mBps: fifteen.rangeBps,
      momentum2mBps: two.momentumBps, momentum5mBps: five.momentumBps, momentum15mBps: fifteen.momentumBps,
      expectedMoveBpsA21: expected.expectedMoveBps,
      directionPersistenceFactor: expected.persistenceFactor,
      realisticRoundTripCostBps, stressRoundTripCostBps,
      requiredRealisticEdgeBps: realisticRoundTripCostBps + this.config.minExpectedEdgeBps,
      crossoverDetected: crossoverKind !== null,
      crossoverConfirmed: candidate !== null,
      rawSignalKind: raw.kind,
      tickerWindowReady,
      a2LegacyRollingRangeBps: a2Legacy.rangeBps,
      a2WouldBlock: emaSeparationBps < 0.5 || a2Legacy.rangeBps <= 35,
    };
    this.state.latestTelemetry = telemetry;

    if (crossoverKind && !candidate) {
      return this.filtered("MICRO_CROSSOVER_FILTERED", crossoverKind, "EMA crossover awaiting A2.1 minimum separation", telemetry, timestamp);
    }
    if (!candidate) return this.signal("HOLD", "No confirmed EMA A2.1 crossover", telemetry, timestamp);
    if (candidate === "BUY" && !tickerWindowReady) {
      return this.filtered("INSUFFICIENT_15M_RANGE", candidate, "A2.1 ticker window is not warm", telemetry, timestamp);
    }
    if (candidate === "BUY" && five.rangeBps < this.config.minRange5mBps) {
      return this.filtered("INSUFFICIENT_5M_RANGE", candidate, "Ticker range 5m is below A2.1 threshold", telemetry, timestamp);
    }
    if (candidate === "BUY" && fifteen.rangeBps < this.config.minRange15mBps) {
      return this.filtered("INSUFFICIENT_15M_RANGE", candidate, "Ticker range 15m is below A2.1 threshold", telemetry, timestamp);
    }
    if (candidate === "BUY" && expected.expectedMoveBps <= telemetry.requiredRealisticEdgeBps) {
      return this.filtered("INSUFFICIENT_REALISTIC_EDGE", candidate, "A2.1 expected move does not cover realistic simulated cost", telemetry, timestamp);
    }
    return this.signal(candidate, `EMA 9/21 A2.1 ${candidate} crossover confirmed`, telemetry, timestamp);
  }

  snapshot(): EmaCrossA21State {
    return { ...this.state, ema: { ...this.state.ema }, points: this.state.points.map((point) => ({ ...point })) };
  }

  restore(state: EmaCrossA21State): void {
    this.baseline.restore(state.ema);
    this.state = { ...state, ema: { ...state.ema }, points: state.points.map((point) => ({ ...point })) };
  }

  private filtered(code: string, side: "BUY" | "SELL", reason: string, telemetry: EmaCrossA21Telemetry, timestamp: number) {
    return this.signal("HOLD", reason, telemetry, timestamp, { filterCode: code, filteredSignalKind: side });
  }

  private signal(
    kind: StrategySignal["kind"], reason: string, telemetry: EmaCrossA21Telemetry, timestamp: number,
    extra: Record<string, string> = {},
  ): StrategySignal {
    return { kind, symbol: this.symbol, strategy: "EMA_CROSS", reason, timestamp, metadata: { variant: "A2.1", ...telemetry, ...extra } };
  }
}
