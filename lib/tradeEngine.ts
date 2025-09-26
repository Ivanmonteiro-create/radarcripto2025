// lib/tradeEngine.ts
// Motor simples de simulação para Spot: calcula tamanho de posição,
// PnL não–realizado, Equity, histórico de operações e exportação.

export type Side = "BUY" | "SELL";

export interface Trade {
  id: string;
  time: number;          // epoch ms
  symbol: string;
  side: Side;
  qty: number;           // quantidade do ativo
  price: number;         // preço de execução
  fee: number;           // taxa estimada (0.04% default)
  note?: string;
}

export interface Position {
  symbol: string;
  qty: number;           // quantidade atual
  avgPrice: number;      // preço médio
}

export interface EngineSnapshot {
  balance: number;       // saldo em USDT “livre”
  equity: number;        // balance + PnL
  pnl: number;           // PnL não-realizado da posição atual desse símbolo
  position?: Position;
  history: Trade[];
}

export interface EngineOpts {
  initialBalance?: number;     // default 100_000
  takerFeePct?: number;        // 0.0004 = 0.04%
}

export class TradeEngine {
  private balance: number;
  private takerFeePct: number;
  private positions: Map<string, Position>;
  private history: Trade[] = [];

  constructor(opts: EngineOpts = {}) {
    this.balance = opts.initialBalance ?? 100_000;
    this.takerFeePct = opts.takerFeePct ?? 0.0004;
    this.positions = new Map();
  }

  reset(initialBalance?: number) {
    this.balance = initialBalance ?? 100_000;
    this.positions.clear();
    this.history = [];
  }

  snapshot(symbol: string, markPrice: number): EngineSnapshot {
    const pos = this.positions.get(symbol);
    const pnl = pos ? (markPrice - pos.avgPrice) * pos.qty : 0;
    const equity = this.balance + this.totalUnrealized(markPriceMap(symbol, markPrice));
    return {
      balance: round(this.balance, 2),
      equity: round(equity, 2),
      pnl: round(pnl, 2),
      position: pos ? { ...pos } : undefined,
      history: [...this.history].reverse(), // mais recente primeiro
    };
  }

  /** Calcula tamanho de posição em USDT com base no risco % e stop-loss. */
  calcPositionSizeUSD(riskPct: number, entry: number, stop: number): number {
    const risk = Math.abs(entry - stop);
    if (risk <= 0) return 0;
    const riskUSDT = (this.balance * (riskPct / 100));
    // qty = riscoUSDT / riscoPorUnidade
    const qty = riskUSDT / risk;
    const notional = qty * entry;
    // não ultrapassar saldo
    return Math.max(0, Math.min(notional, this.balance));
  }

  /** Executa compra/venda market. */
  market(symbol: string, side: Side, notionalUSDT: number, price: number) {
    if (notionalUSDT <= 0) return;

    const fee = notionalUSDT * this.takerFeePct;
    const qty = notionalUSDT / price;

    // Atualiza posição
    const prev = this.positions.get(symbol) ?? { symbol, qty: 0, avgPrice: 0 };
    let newQty = prev.qty;
    let newAvg = prev.avgPrice;

    if (side === "BUY") {
      // média ponderada
      newAvg = (prev.avgPrice * prev.qty + price * qty) / (prev.qty + qty);
      newQty = prev.qty + qty;
      this.balance -= (notionalUSDT + fee);
    } else {
      // SELL reduz posição; se zera, ajusta avgPrice
      newQty = prev.qty - qty;
      this.balance += (notionalUSDT - fee);
      if (newQty <= 1e-10) {
        newQty = 0;
        newAvg = 0;
      }
    }

    this.positions.set(symbol, { symbol, qty: newQty, avgPrice: newAvg });

    this.history.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      time: Date.now(),
      symbol,
      side,
      qty,
      price,
      fee,
    });
  }

  /** Zera a posição inteira no preço de mercado. */
  close(symbol: string, price: number) {
    const pos = this.positions.get(symbol);
    if (!pos || pos.qty <= 0) return;
    this.market(symbol, "SELL", pos.qty * price, price);
  }

  /** Soma PnL de todas as posições (para equity geral) usando um único preço do símbolo focado. */
  private totalUnrealized(map: Map<string, number>) {
    let total = 0;
    for (const [sym, pos] of this.positions) {
      const mark = map.get(sym);
      if (!mark || pos.qty === 0) continue;
      total += (mark - pos.avgPrice) * pos.qty;
    }
    return total;
  }

  /** Acesso de leitura */
  getPosition(symbol: string) { return this.positions.get(symbol); }
  getBalance() { return this.balance; }
  getHistory() { return [...this.history]; }
}

function round(n: number, d = 2) {
  const p = Math.pow(10, d);
  return Math.round(n * p) / p;
}
function markPriceMap(symbol: string, price: number) {
  const m = new Map<string, number>();
  m.set(symbol, price);
  return m;
}

// Singleton simples para reaproveitar estado entre renders da página.
let _engine: TradeEngine | null = null;
export function getEngine() {
  if (!_engine) _engine = new TradeEngine();
  return _engine;
}
