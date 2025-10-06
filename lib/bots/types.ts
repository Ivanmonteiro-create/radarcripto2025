// lib/bots/types.ts
export type SymbolPair = `${string}USDT` | string;

export type Side = "BUY" | "SELL";
export type Signal = "BUY" | "SELL" | "HOLD";

export type BotMode = "SIM"; // futuro: "PAPER", "LIVE"

export type StrategyKind = "ema-cross"; // futuro: "rsi", "breakout", etc.

export type BotConfig = {
  id: string;
  name: string;
  pair: SymbolPair;
  mode: BotMode;
  strategy: {
    kind: StrategyKind;
    params: Record<string, number>;
  };
  risk: {
    capitalUSDT: number;     // banca alocada p/ esse bot
    orderSizePct: number;    // % da banca por trade (ex.: 10 => 10%)
    takeProfitPct?: number;  // TP percentual opcional (ex.: 2)
    stopLossPct?: number;    // SL percentual opcional (ex.: 1)
  };
  enabled: boolean;
  createdAt: number;
};

export type Position = {
  side: Side;              // BUY = long, SELL = short (simulado simples)
  entryPrice: number;
  qtyUSDT: number;         // quanto em USDT foi usado
  size: number;            // “quantidade” do ativo (qtyUSDT/price)
  openedAt: number;
};

export type OrderFill = {
  side: Side;
  price: number;
  qtyUSDT: number;
  size: number;
  ts: number;
  reason: "signal" | "tp" | "sl";
};

export type BotRuntime = {
  id: string;              // bot id
  equityUSDT: number;      // banca viva
  openPos?: Position | null;
  lastSignal?: Signal;
  fills: OrderFill[];
  pnlUSDT: number;         // acumulado fechado
  peakEquity?: number;     // p/ drawdown
  minEquity?: number;
  bars: number;            // quantas velas/ticks processados
};
