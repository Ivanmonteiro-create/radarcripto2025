import type { SymbolInfo } from "./domain";

export const STRATEGY_B_START_AUTHORIZATION = "I_AUTHORIZE_BINANCE_SPOT_TESTNET_STRATEGY_B_START";
export const MIN_RANGE_LEVELS = 1;
export const MAX_RANGE_LEVELS = 10;

export type RangeStrategyMode = "READY" | "CUSTOM";
export type RangeLevelState = "WAITING_BUY" | "BUY_PENDING" | "WAITING_SELL" | "SELL_PENDING" | "COMPLETED" | "STOPPED" | "ERROR";

export interface RangeLevelInput {
  levelNumber: number;
  entryPrice: number;
  targetPrice: number;
  quoteAmount: number;
  enabled: boolean;
  repeat: boolean;
}

export interface RangeConfigInput {
  mode: RangeStrategyMode;
  name: string;
  symbol: string;
  capitalTotal: number;
  maxCommitted: number;
  maxExposure: number;
  structuralStop: number;
  simulatedMakerFeeBps: number;
  simulatedSlippageBps: number;
  costWarningAccepted: boolean;
  levels: RangeLevelInput[];
}

export interface LevelEconomics {
  levelNumber: number;
  grossProfitQuote: number;
  simulatedCostsQuote: number;
  estimatedNetProfitQuote: number;
  grossDistancePct: number;
  belowEstimatedCosts: boolean;
}

export interface RangeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  committedQuote: number;
  availableQuote: number;
  economics: LevelEconomics[];
}

const finitePositive = (value: number) => Number.isFinite(value) && value > 0;
const decimals = (step: number) => Math.max(0, (String(step).split(".")[1] ?? "").replace(/0+$/, "").length);
const aligned = (value: number, step: number) => {
  if (!(step > 0)) return false;
  const scaled = value / step;
  return Math.abs(scaled - Math.round(scaled)) < 1e-7;
};

export function validateRangeConfiguration(config: RangeConfigInput, symbolInfo: SymbolInfo): RangeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const enabled = config.levels.filter((level) => level.enabled);
  if (config.mode !== "READY" && config.mode !== "CUSTOM") errors.push("INVALID_CONFIGURATION_MODE");
  if (config.symbol !== symbolInfo.symbol) errors.push("SYMBOL_MISMATCH");
  if (symbolInfo.status !== "TRADING" || !symbolInfo.spotAllowed) errors.push("SYMBOL_NOT_ACTIVE_FOR_SPOT");
  if (symbolInfo.quoteAsset !== "USDT") errors.push("ONLY_USDT_QUOTE_IS_SUPPORTED_IN_TESTNET");
  if (config.levels.length < MIN_RANGE_LEVELS || config.levels.length > MAX_RANGE_LEVELS) errors.push("LEVEL_COUNT_OUT_OF_RANGE");
  if (enabled.length === 0) errors.push("AT_LEAST_ONE_LEVEL_MUST_BE_ENABLED");
  if (!finitePositive(config.capitalTotal) || !finitePositive(config.maxCommitted) || !finitePositive(config.maxExposure)) errors.push("CAPITAL_LIMITS_MUST_BE_POSITIVE");
  if (config.maxCommitted > config.capitalTotal) errors.push("MAX_COMMITTED_EXCEEDS_TOTAL_CAPITAL");
  if (config.maxExposure > config.maxCommitted) errors.push("MAX_EXPOSURE_EXCEEDS_MAX_COMMITTED");
  if (!finitePositive(config.structuralStop)) errors.push("STRUCTURAL_STOP_MUST_BE_POSITIVE");
  if (enabled.some((level) => config.structuralStop >= level.entryPrice)) errors.push("STRUCTURAL_STOP_MUST_BE_BELOW_ALL_ENTRIES");
  if (new Set(config.levels.map((level) => level.levelNumber)).size !== config.levels.length) errors.push("DUPLICATE_LEVEL_NUMBER");

  const economics = enabled.map((level): LevelEconomics => {
    if (!finitePositive(level.entryPrice) || !finitePositive(level.targetPrice) || !finitePositive(level.quoteAmount)) errors.push(`LEVEL_${level.levelNumber}_VALUES_MUST_BE_POSITIVE`);
    if (level.targetPrice <= level.entryPrice) errors.push(`LEVEL_${level.levelNumber}_TARGET_MUST_EXCEED_ENTRY`);
    if (!aligned(level.entryPrice, symbolInfo.filter.tickSize)) errors.push(`LEVEL_${level.levelNumber}_ENTRY_TICK_SIZE`);
    if (!aligned(level.targetPrice, symbolInfo.filter.tickSize)) errors.push(`LEVEL_${level.levelNumber}_TARGET_TICK_SIZE`);
    const quantity = level.quoteAmount / level.entryPrice;
    if (quantity < symbolInfo.filter.minQuantity) errors.push(`LEVEL_${level.levelNumber}_MIN_QTY`);
    if (level.quoteAmount < symbolInfo.filter.minNotional) errors.push(`LEVEL_${level.levelNumber}_MIN_NOTIONAL`);
    const grossProfitQuote = quantity * (level.targetPrice - level.entryPrice);
    const simulatedCostsQuote = level.quoteAmount * 2 * (config.simulatedMakerFeeBps + config.simulatedSlippageBps) / 10_000;
    const estimatedNetProfitQuote = grossProfitQuote - simulatedCostsQuote;
    const belowEstimatedCosts = estimatedNetProfitQuote <= 0;
    if (belowEstimatedCosts) warnings.push(`LEVEL_${level.levelNumber}_TARGET_BELOW_ESTIMATED_COSTS`);
    return {
      levelNumber: level.levelNumber,
      grossProfitQuote,
      simulatedCostsQuote,
      estimatedNetProfitQuote,
      grossDistancePct: (level.targetPrice / level.entryPrice - 1) * 100,
      belowEstimatedCosts,
    };
  });
  const committedQuote = enabled.reduce((sum, level) => sum + level.quoteAmount, 0);
  if (committedQuote > config.maxCommitted + 1e-8) errors.push("LEVEL_SUM_EXCEEDS_MAX_COMMITTED");
  if (committedQuote > config.maxExposure + 1e-8) errors.push("LEVEL_SUM_EXCEEDS_MAX_EXPOSURE");
  if (warnings.length && !config.costWarningAccepted) errors.push("COST_WARNING_CONFIRMATION_REQUIRED");
  if (decimals(symbolInfo.filter.tickSize) > 12 || decimals(symbolInfo.filter.stepSize) > 12) errors.push("UNSUPPORTED_EXCHANGE_PRECISION");
  return { valid: errors.length === 0, errors: [...new Set(errors)], warnings, committedQuote, availableQuote: config.capitalTotal - committedQuote, economics };
}

export interface RangeLevelDecisionInput {
  id: string;
  levelNumber: number;
  state: RangeLevelState;
  entryPrice: number;
  targetPrice: number;
  quoteAmount: number;
  repeat: boolean;
  heldQuantity: number;
  activeCycleId?: string;
}

export type RangeDecision =
  | { kind: "HOLD"; reason: string }
  | { kind: "BUY"; levelId: string; levelNumber: number; limitPrice: number; quoteAmount: number }
  | { kind: "SELL"; levelId: string; levelNumber: number; cycleId: string; limitPrice: number; quantity: number; structuralStop: boolean };

export function decideRangeAction(price: number, structuralStop: number, levels: RangeLevelDecisionInput[]): RangeDecision {
  const holding = levels.filter((level) => level.state === "WAITING_SELL" && level.heldQuantity > 0 && level.activeCycleId);
  if (holding.length && price <= structuralStop) {
    const level = holding.sort((a, b) => a.levelNumber - b.levelNumber)[0];
    return { kind: "SELL", levelId: level.id, levelNumber: level.levelNumber, cycleId: level.activeCycleId!, limitPrice: structuralStop, quantity: level.heldQuantity, structuralStop: true };
  }
  const target = holding.filter((level) => price >= level.targetPrice).sort((a, b) => a.levelNumber - b.levelNumber)[0];
  if (target) return { kind: "SELL", levelId: target.id, levelNumber: target.levelNumber, cycleId: target.activeCycleId!, limitPrice: target.targetPrice, quantity: target.heldQuantity, structuralStop: false };
  const entry = levels.filter((level) => level.state === "WAITING_BUY").sort((a, b) => b.entryPrice - a.entryPrice || a.levelNumber - b.levelNumber)[0];
  if (entry) return { kind: "BUY", levelId: entry.id, levelNumber: entry.levelNumber, limitPrice: entry.entryPrice, quoteAmount: entry.quoteAmount };
  return { kind: "HOLD", reason: holding.length ? "Levels are waiting for configured targets" : "No actionable range level" };
}

export function nextLevelStateAfterFill(side: "BUY" | "SELL", repeat: boolean): RangeLevelState {
  if (side === "BUY") return "WAITING_SELL";
  return repeat ? "WAITING_BUY" : "COMPLETED";
}
