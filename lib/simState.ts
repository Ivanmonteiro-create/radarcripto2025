// lib/simState.ts
export type Side = 'LONG' | 'SHORT';

export type PlanTier = 'FREE' | 'TRADER' | 'PRO' | 'ELITE';

export type Position = {
  side: Side;
  symbol: string;
  qty: number;           // quantidade em moeda (ex.: BTC)
  entryPrice: number;    // preço médio de entrada
  ts: number;            // timestamp de abertura
  tpPct?: number | null; // % opcional
  slPct?: number | null; // % opcional
};

export type TradeFill = {
  kind: 'OPEN' | 'CLOSE' | 'SL' | 'TP';
  side: 'BUY' | 'SELL';
  symbol: string;
  price: number;
  qty: number;
  pnl?: number;          // PnL realizado em USDT (apenas no CLOSE/SL/TP)
  ts: number;
};

export type SimState = {
  plan: PlanTier;
  balance: number;       // saldo em USDT
  history: TradeFill[];
  position?: Position | null;
};

const KEY = 'rc-sim-v1';

export function loadSimState(): SimState {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
    if (raw) {
      const obj = JSON.parse(raw) as SimState;
      // sanity defaults
      obj.plan ||= 'FREE';
      obj.balance = Number(obj.balance ?? 10_000);
      obj.history ||= [];
      return obj;
    }
  } catch {}
  return {
    plan: 'FREE',
    balance: 10_000,
    history: [],
    position: null,
  };
}

export function saveSimState(state: SimState) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    }
  } catch {}
}

// util PnL não realizado
export function calcUnrealizedPnl(pos: Position, price: number): number {
  const diff = pos.side === 'LONG' ? (price - pos.entryPrice) : (pos.entryPrice - price);
  return diff * pos.qty;
}
