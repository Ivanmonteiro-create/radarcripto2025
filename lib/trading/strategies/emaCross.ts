import type { StrategySignal } from "../domain";

export interface EmaCrossConfig {
  shortPeriod: number;
  longPeriod: number;
}

export interface EmaCrossState {
  observations: number;
  shortEma?: number;
  longEma?: number;
  previousDifference?: number;
}

export class EmaCrossStrategy {
  private state: EmaCrossState = { observations: 0 };

  constructor(
    private readonly symbol: string,
    private readonly config: EmaCrossConfig,
  ) {
    if (!Number.isInteger(config.shortPeriod) || !Number.isInteger(config.longPeriod)) {
      throw new Error("EMA periods must be integers");
    }
    if (config.shortPeriod < 2 || config.longPeriod <= config.shortPeriod) {
      throw new Error("EMA periods require 2 <= shortPeriod < longPeriod");
    }
  }

  update(price: number, timestamp = Date.now()): StrategySignal {
    if (!Number.isFinite(price) || price <= 0) throw new Error("EMA price must be positive");
    const shortAlpha = 2 / (this.config.shortPeriod + 1);
    const longAlpha = 2 / (this.config.longPeriod + 1);
    this.state.shortEma = this.state.shortEma === undefined
      ? price
      : price * shortAlpha + this.state.shortEma * (1 - shortAlpha);
    this.state.longEma = this.state.longEma === undefined
      ? price
      : price * longAlpha + this.state.longEma * (1 - longAlpha);
    this.state.observations += 1;

    const difference = this.state.shortEma - this.state.longEma;
    const previous = this.state.previousDifference;
    this.state.previousDifference = difference;
    if (this.state.observations < this.config.longPeriod || previous === undefined) {
      return this.signal("HOLD", "EMA warm-up in progress", timestamp);
    }
    if (previous <= 0 && difference > 0) {
      return this.signal("BUY", "Short EMA crossed above long EMA", timestamp);
    }
    if (previous >= 0 && difference < 0) {
      return this.signal("SELL", "Short EMA crossed below long EMA", timestamp);
    }
    return this.signal("HOLD", "No EMA crossover", timestamp);
  }

  snapshot(): EmaCrossState {
    return { ...this.state };
  }

  restore(state: EmaCrossState): void {
    if (!Number.isInteger(state.observations) || state.observations < 0) {
      throw new Error("Invalid EMA state");
    }
    this.state = { ...state };
  }

  reset(): void {
    this.state = { observations: 0 };
  }

  private signal(kind: StrategySignal["kind"], reason: string, timestamp: number): StrategySignal {
    return {
      kind,
      symbol: this.symbol,
      strategy: "EMA_CROSS",
      reason,
      timestamp,
      metadata: {
        observations: this.state.observations,
        shortEma: this.state.shortEma ?? null,
        longEma: this.state.longEma ?? null,
      },
    };
  }
}
