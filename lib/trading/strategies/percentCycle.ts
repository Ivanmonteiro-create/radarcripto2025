import type { StrategySignal } from "../domain";

export type PercentCycleStatus =
  | "WAITING_BUY"
  | "BUY_ORDER_PENDING"
  | "HOLDING_ASSET"
  | "SELL_ORDER_PENDING"
  | "WAITING_REBUY"
  | "PAUSED"
  | "ERROR";

export interface PercentCycleConfig {
  symbol: string;
  capitalUSDT: number;
  sellRisePct: number;
  rebuyDropPct: number;
  optionalStopLossPct?: number;
  maxCapitalUSDT: number;
}

export interface PercentCycleState {
  status: PercentCycleStatus;
  lastBuyPrice?: number;
  lastSellPrice?: number;
}

export class PercentCycleStrategy {
  private state: PercentCycleState = { status: "WAITING_BUY" };

  constructor(private readonly config: PercentCycleConfig) {
    if (config.capitalUSDT <= 0 || config.capitalUSDT > config.maxCapitalUSDT) {
      throw new Error("PERCENT_CYCLE capital exceeds its configured limit");
    }
    if (config.sellRisePct <= 0 || config.rebuyDropPct <= 0) {
      throw new Error("PERCENT_CYCLE percentages must be positive");
    }
  }

  evaluate(price: number, timestamp = Date.now()): StrategySignal {
    if (!Number.isFinite(price) || price <= 0) throw new Error("Price must be positive");
    if (this.state.status === "WAITING_BUY") return this.signal("BUY", "Initial cycle buy", timestamp);
    if (this.state.status === "HOLDING_ASSET" && this.state.lastBuyPrice) {
      const changePct = ((price - this.state.lastBuyPrice) / this.state.lastBuyPrice) * 100;
      if (changePct >= this.config.sellRisePct) return this.signal("SELL", "Sell-rise target reached", timestamp);
      if (this.config.optionalStopLossPct && changePct <= -this.config.optionalStopLossPct) {
        return this.signal("SELL", "Optional stop loss reached", timestamp);
      }
    }
    if (this.state.status === "WAITING_REBUY" && this.state.lastSellPrice) {
      const dropPct = ((this.state.lastSellPrice - price) / this.state.lastSellPrice) * 100;
      if (dropPct >= this.config.rebuyDropPct) return this.signal("BUY", "Rebuy-drop target reached", timestamp);
    }
    return this.signal("HOLD", `State ${this.state.status} has no trigger`, timestamp);
  }

  markOrderPending(side: "BUY" | "SELL"): void {
    this.state.status = side === "BUY" ? "BUY_ORDER_PENDING" : "SELL_ORDER_PENDING";
  }

  markFilled(side: "BUY" | "SELL", price: number): void {
    if (side === "BUY") this.state = { ...this.state, status: "HOLDING_ASSET", lastBuyPrice: price };
    else this.state = { ...this.state, status: "WAITING_REBUY", lastSellPrice: price };
  }

  snapshot(): PercentCycleState {
    return { ...this.state };
  }

  restore(state: PercentCycleState): void {
    this.state = { ...state };
  }

  private signal(kind: StrategySignal["kind"], reason: string, timestamp: number): StrategySignal {
    return { kind, symbol: this.config.symbol, strategy: "PERCENT_CYCLE", reason, timestamp };
  }
}
