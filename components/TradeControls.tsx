'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  symbol: string;                     // ex.: "BTCUSDT"
  onSymbolChange: (s: string) => void;
};

// ==== util ====
const fmt2 = (n: number) => (isFinite(n) ? n.toFixed(2) : '0.00');
const nowIso = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const isBrowser = typeof window !== 'undefined';

type Side = 'LONG' | 'SHORT';
type Position = {
  side: Side;
  symbol: string;
  entry: number;
  qty: number;
  tp?: number;
  sl?: number;
  openedAt: string;
};
type Trade = {
  id: string;
  symbol: string;
  side: Side;
  entry: number;
  exit: number;
  pnl: number;
  pnlPct: number;
  qty: number;
  openedAt: string;
  closedAt: string;
};

const LS = {
  equity: 'rc_equity',
  pos: 'rc_position',
  hist: 'rc_history',
};

export default function TradeControls({ symbol, onSymbolChange }: Props) {
  // ====== inputs/estados (sem tocar em localStorage no render SSR) ======
  const [equity, setEquity] = useState<number>(10000);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [tpPct, setTpPct] = useState<number>(0);
  const [slPct, setSlPct] = useState<number>(0);
  const [qtyInput, setQtyInput] = useState<number>(1000);

  const [position, setPosition] = useState<Position | null>(null);
  const [history, setHistory] = useState<Trade[]>([]);

  // Carrega do localStorage apenas no cliente
  useEffect(() => {
    if (!isBrowser) return;
    try {
      const eq = window.localStorage.getItem(LS.equity);
      if (eq) setEquity(Number(eq));
      const rawPos = window.localStorage.getItem(LS.pos);
      if (rawPos) setPosition(JSON.parse(rawPos));
      const rawHist = window.localStorage.getItem(LS.hist);
      if (rawHist) setHistory(JSON.parse(rawHist));
    } catch {}
  }, []);

  // Persiste no localStorage (cliente)
  useEffect(() => {
    if (!isBrowser) return;
    try { window.localStorage.setItem(LS.equity, String(equity)); } catch {}
  }, [equity]);

  useEffect(() => {
    if (!isBrowser) return;
    try {
      if (position) window.localStorage.setItem(LS.pos, JSON.stringify(position));
      else window.localStorage.removeItem(LS.pos);
    } catch {}
  }, [position]);

  useEffect(() => {
    if (!isBrowser) return;
    try { window.localStorage.setItem(LS.hist, JSON.stringify(history)); } catch {}
  }, [history]);

  // ====== preço ao vivo (polling leve) ======
  const [price, setPrice] = useState<number>(0);
  const pollRef = useRef<any>(null);

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`, { cache: 'no-store' });
      const data = await res.json();
      const p = Number(data?.price);
      if (!Number.isNaN(p)) setPrice(p);
    } catch {}
  }, [symbol]);

  useEffect(() => {
    fetchPrice();
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchPrice, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchPrice]);

  // ====== derivados ======
  const suggestedQty = useMemo(() => {
    if (!price || riskPct <= 0) return 0;
    const riskUSDT = equity * (riskPct / 100);
    const stopPct = slPct > 0 ? slPct : 1; // fallback
    return riskUSDT / ((stopPct / 100) * price);
  }, [equity, price, riskPct, slPct]);

  const floatPnL = useMemo(() => {
    if (!position || !price) return 0;
    const diff = position.side === 'LONG' ? (price - position.entry) : (position.entry - price);
    return diff * position.qty;
  }, [position, price]);

  const floatPct = useMemo(() => {
    if (!position || !price) return 0;
    const pct = ((price - position.entry) / position.entry) * 100 * (position.side === 'LONG' ? 1 : -1);
    return pct;
  }, [position, price]);

  // ====== abrir/fechar ======
  const openPosition = (side: Side) => {
    if (!price) return;
    if (position) {
      if (position.side !== side) closePosition();
      return;
    }
    const qty = suggestedQty || Math.max(0.0001, (qtyInput / price));
    const entry = price;
    const p: Position = {
      side, symbol, entry, qty,
      tp: tpPct > 0 ? (side === 'LONG' ? entry * (1 + tpPct/100) : entry * (1 - tpPct/100)) : undefined,
      sl: slPct > 0 ? (side === 'LONG' ? entry * (1 - slPct/100) : entry * (1 + slPct/100)) : undefined,
      openedAt: nowIso(),
    };
    setPosition(p);
  };

  const closePosition = () => {
    if (!position || !price) return;
    const exit = price;
    const pnl = (position.side === 'LONG' ? (exit - position.entry) : (position.entry - exit)) * position.qty;
    const pnlPct = ((exit - position.entry) / position.entry) * 100 * (position.side === 'LONG' ? 1 : -1);
    setEquity(prev => prev + pnl);
    const tr: Trade = {
      id: (isBrowser && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now()}`,
      symbol: position.symbol,
      side: position.side,
      entry: position.entry,
      exit, pnl, pnlPct,
      qty: position.qty,
      openedAt: position.openedAt,
      closedAt: nowIso(),
    };
    setHistory(prev => [tr, ...prev]);
    setPosition(null);
  };

  // TP/SL auto
  useEffect(() => {
    if (!position || !price) return;
    const { tp, sl, side } = position;
    if (tp && (side === 'LONG' ? price >= tp : price <= tp)) closePosition();
    if (sl && (side === 'LONG' ? price <= sl : price >= sl)) closePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  const resetAll = () => {
    setRiskPct(1); setTpPct(0); setSlPct(0); setQtyInput(1000); setPosition(null);
  };

  // ====== UI (mantido) ======
  return (
    <div className="compactPanel compactRoot" style={{ display: 'grid', gap: 10 }}>
      <div className="kpiGrid">
        <div className="kpiCard"><div className="kpiLabel">Preço</div><div className="kpiValue">{price ? fmt2(price) : '—'}</div></div>
        <div className="kpiCard"><div className="kpiLabel">Equity</div><div className="kpiValue">{fmt2(equity)} USDT</div></div>
        <div className="kpiCard">
          <div className="kpiLabel">PnL flutuante</div>
          <div className="kpiValue" style={{ color: floatPnL >= 0 ? '#1cff80' : '#ff6b6b' }}>
            {fmt2(floatPnL)} USDT ({fmt2(floatPct)}%)
          </div>
        </div>
      </div>

      <div className="twoCols">
        <div className="cardMini">
          <div className="cardTitle">Take Profit (%)</div>
          <div className="twoCols">
            <input className="inp" type="number" value={tpPct || ''} placeholder="%"
                   onChange={e => setTpPct(Number(e.target.value || 0))} />
            <button className="btn" onClick={() => setTpPct(0)}>Zerar</button>
          </div>
        </div>
        <div className="cardMini">
          <div className="cardTitle">Stop Loss (%)</div>
          <div className="twoCols">
            <input className="inp" type="number" value={slPct || ''} placeholder="%"
                   onChange={e => setSlPct(Number(e.target.value || 0))} />
            <button className="btn" onClick={() => setSlPct(0)}>Zerar</button>
          </div>
        </div>
      </div>

      <div className="threeCols">
        <div className="cardMini">
          <div className="cardTitle">Saldo (USDT)</div>
          <input className="inp" type="number" value={equity} onChange={e => setEquity(Number(e.target.value || 0))} />
          <div className="muted xs">Equity simulado total</div>
        </div>
        <div className="cardMini">
          <div className="cardTitle">Risco por trade (%)</div>
          <input className="inp" type="number" value={riskPct} onChange={e => setRiskPct(Number(e.target.value || 0))} />
          <div className="muted xs">Tamanho sug.: {suggestedQty ? suggestedQty.toFixed(5) : '—'}</div>
        </div>
        <div className="cardMini">
          <div className="cardTitle">USDT p/ referência</div>
          <input className="inp" type="number" value={qtyInput} onChange={e => setQtyInput(Number(e.target.value || 0))} />
          <div className="muted xs">Usado só como fallback p/ qty</div>
        </div>
      </div>

      <div className="cardMini">
        <div className="cardTitle">Par</div>
        <div className="twoCols">
          <select className="inp" value={symbol} onChange={e => onSymbolChange(e.target.value)}>
            <option>BTCUSDT</option><option>ETHUSDT</option><option>SOLUSDT</option><option>LINKUSDT</option>
            <option>BNBUSDT</option><option>XRPUSDT</option><option>DOGEUSDT</option><option>ADAUSDT</option>
          </select>
          <button className="btn" onClick={resetAll}>Resetar</button>
        </div>
      </div>

      <div className="twoCols" style={{ marginTop: 2 }}>
        <button className="btn btnBuy" onClick={() => openPosition('LONG')}
                title={position?.side === 'SHORT' ? 'Fechar SHORT' : 'Abrir LONG'}>
          {position?.side === 'SHORT' ? 'Fechar Short' : 'Comprar'}
        </button>
        <button className="btn btnSell" onClick={() => openPosition('SHORT')}
                title={position?.side === 'LONG' ? 'Fechar LONG' : 'Abrir SHORT'}>
          {position?.side === 'LONG' ? 'Fechar Long' : 'Vender'}
        </button>
      </div>

      <div className="cardMini">
        <div className="cardTitle">Histórico recente</div>
        <div className="histWrap">
          {history.length === 0 && <div className="histRow muted xs">Sem operações ainda.</div>}
          {history.map(tr => (
            <div key={tr.id} className="histRow">
              <div className="xs muted">{tr.openedAt} → {tr.closedAt}</div>
              <div className="xs" style={{ marginTop: 4 }}>
                {tr.symbol} • {tr.side} • ent: {fmt2(tr.entry)} • sai: {fmt2(tr.exit)} •{' '}
                <strong style={{ color: tr.pnl >= 0 ? '#1cff80' : '#ff6b6b' }}>
                  {fmt2(tr.pnl)} USDT ({fmt2(tr.pnlPct)}%)
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
