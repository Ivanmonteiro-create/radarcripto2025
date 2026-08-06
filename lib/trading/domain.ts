export type ExchangeMode = "SIM" | "TESTNET";
export type BotStatus = "STOPPED" | "RUNNING" | "PAUSED" | "ERROR";
export type OrderStatus =
  | "PENDING"
  | "UNKNOWN"
  | "OPEN"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CANCELLED"
  | "REJECTED";
export type OrderSide = "BUY" | "SELL";
export type PositionSide = "LONG";
export type OrderType = "MARKET" | "LIMIT";
export type StrategyKind = "EMA_CROSS" | "PERCENT_CYCLE";
export type StrategySignalKind = "BUY" | "SELL" | "HOLD";

export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  averageEntryPrice: number;
  side: PositionSide;
  openedAt: number;
  updatedAt: number;
  realizedPnl: number;
  unrealizedPnl: number;
  costBasisQuote: number;
}

export interface Order {
  id: string;
  exchangeOrderId?: string;
  clientOrderId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  requestedQuantity: number;
  executedQuantity: number;
  requestedPrice?: number;
  averageFillPrice?: number;
  rejectReason?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Fill {
  id: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  price: number;
  quantity: number;
  feeQuote: number;
  feeAsset?: string;
  feeAmount?: number;
  timestamp: number;
}

export interface Trade {
  id: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  price: number;
  quantity: number;
  notionalQuote: number;
  feeQuote: number;
  feeAsset?: string;
  feeAmount?: number;
  realizedPnl: number;
  timestamp: number;
}

export interface BotConfig {
  id: string;
  userId: string;
  name: string;
  symbol: string;
  mode: ExchangeMode;
  status: BotStatus;
  strategy: StrategyKind;
  strategyParams: Record<string, number | string | boolean | null>;
  capitalUSDT: number;
  maxCapitalUSDT: number;
  maxOrderUSDT: number;
  maxPositions: number;
  maxDailyLossUSDT: number;
  maxDrawdownPct: number;
  minOrderIntervalMs: number;
  takeProfitPct?: number;
  stopLossPct?: number;
  createdAt: number;
  updatedAt: number;
}

export interface BotRuntime {
  botId: string;
  status: BotStatus;
  lastPrice?: number;
  lastSignal?: StrategySignal;
  lastOrderAt?: number;
  lastError?: string;
  peakEquity: number;
  dailyRealizedPnl: number;
  dailyPnlDate?: number;
  strategyState: Record<string, unknown>;
  updatedAt: number;
}

export interface BalanceSnapshot {
  id: string;
  asset: string;
  free: number;
  locked: number;
  total: number;
  equityUSDT: number;
  timestamp: number;
}

export interface StrategySignal {
  kind: StrategySignalKind;
  symbol: string;
  strategy: StrategyKind;
  reason: string;
  timestamp: number;
  metadata?: Record<string, number | string | boolean | null>;
}

export interface RiskDecision {
  allowed: boolean;
  reason: string;
  maxOrderUSDT?: number;
  code:
    | "ALLOWED"
    | "KILL_SWITCH"
    | "INVALID_SYMBOL"
    | "INVALID_PARAMETERS"
    | "CAPITAL_LIMIT"
    | "ORDER_LIMIT"
    | "POSITION_LIMIT"
    | "DAILY_LOSS_LIMIT"
    | "DRAWDOWN_LIMIT"
    | "ORDER_COOLDOWN"
    | "DUPLICATE_ORDER";
}

export interface SymbolFilter {
  minPrice: number;
  maxPrice: number;
  tickSize: number;
  minQuantity: number;
  maxQuantity: number;
  stepSize: number;
  minNotional: number;
}

export interface SymbolInfo {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  spotAllowed: boolean;
  filter: SymbolFilter;
}

export interface AccountBalance {
  asset: string;
  free: number;
  locked: number;
}

export interface SimulationSnapshot {
  cash: number;
  equity: number;
  realizedPnl: number;
  unrealizedPnl: number;
  positions: Position[];
  orders: Order[];
  fills: Fill[];
  trades: Trade[];
}

export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isSpotUsdtSymbol(symbol: string): boolean {
  return /^[A-Z0-9]{2,15}USDT$/.test(normalizeSymbol(symbol));
}
