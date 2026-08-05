import type { BotConfig, BotRuntime, Position, RiskDecision, StrategySignal } from "./domain";
import { isSpotUsdtSymbol, normalizeSymbol } from "./domain";

export interface RiskContext {
  bot: BotConfig;
  runtime: BotRuntime;
  signal: StrategySignal;
  requestedOrderUSDT: number;
  openPositions: Position[];
  equityUSDT: number;
  killSwitchActive: boolean;
  hasEquivalentOpenOrder: boolean;
  now?: number;
}

const denied = (code: RiskDecision["code"], reason: string): RiskDecision => ({ allowed: false, code, reason });

export function evaluateRisk(context: RiskContext): RiskDecision {
  const now = context.now ?? Date.now();
  if (context.killSwitchActive) return denied("KILL_SWITCH", "Global kill switch is active");
  if (!isSpotUsdtSymbol(context.bot.symbol) || normalizeSymbol(context.bot.symbol) !== context.signal.symbol) {
    return denied("INVALID_SYMBOL", "Signal symbol does not match a valid bot Spot symbol");
  }
  if (!Number.isFinite(context.requestedOrderUSDT) || context.requestedOrderUSDT <= 0) {
    return denied("INVALID_PARAMETERS", "Order value must be positive");
  }
  if (context.bot.capitalUSDT <= 0 || context.bot.capitalUSDT > context.bot.maxCapitalUSDT) {
    return denied("CAPITAL_LIMIT", "Bot capital exceeds the configured maximum");
  }
  if (context.requestedOrderUSDT > context.bot.maxOrderUSDT) {
    return denied("ORDER_LIMIT", "Order value exceeds the per-order limit");
  }
  if (context.signal.kind === "BUY" && context.openPositions.length >= context.bot.maxPositions) {
    return denied("POSITION_LIMIT", "Maximum number of open positions reached");
  }
  if (context.runtime.dailyRealizedPnl <= -Math.abs(context.bot.maxDailyLossUSDT)) {
    return denied("DAILY_LOSS_LIMIT", "Maximum daily loss reached");
  }
  const drawdownPct = context.runtime.peakEquity > 0
    ? ((context.runtime.peakEquity - context.equityUSDT) / context.runtime.peakEquity) * 100
    : 0;
  if (drawdownPct >= context.bot.maxDrawdownPct) {
    return denied("DRAWDOWN_LIMIT", "Maximum drawdown reached");
  }
  if (context.runtime.lastOrderAt && now - context.runtime.lastOrderAt < context.bot.minOrderIntervalMs) {
    return denied("ORDER_COOLDOWN", "Minimum interval between orders has not elapsed");
  }
  if (context.hasEquivalentOpenOrder) return denied("DUPLICATE_ORDER", "Equivalent order is already pending or open");
  return {
    allowed: true,
    code: "ALLOWED",
    reason: "Risk checks passed",
    maxOrderUSDT: Math.min(context.requestedOrderUSDT, context.bot.maxOrderUSDT, context.bot.maxCapitalUSDT),
  };
}
