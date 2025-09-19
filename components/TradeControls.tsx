'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  symbol: string;                     // ex.: "BTCUSDT"
  onSymbolChange: (s: string) => void;
};

/** ===== Util ===== */
const symToBinance = (s: string) => s.toUpperCase(); // aqui já está no formato da Binance
const fmt2 = (n: number) => (isFinite(n) ? n.toFixed(2) : '0.00');
const nowIso = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

/** ===== Tipos ===== */
type Side = 'LONG' | 'SHORT';
type Position = {
  side: Side;
  symbol: string;
  entry: number;    // preço de entrada
  qty: number;      // quantidade (em moeda base, ex.: BTC)
  tp?: number;      // preço de take profit
  sl?: number;      // preço de stop loss
  openedAt: string; // ISO
};

type Trade = {
  id: string;
  symbol: string;
  side: Side;
  entry: number;
  exit: number;
  pnl: number;      // em USDT
  pnlPct: number;   // %
  qty: number;
  openedAt: string;
  closedAt: string;
};

const LS_KEYS = {
  equity: 'rc_equity',
  inputs: 'rc_inputs',
  pos: 'rc_position',
  hist: 'rc_history',
};

/** ===== Componente ===== */
export default function TradeControls({ symbol, onSymbolChange }: Props) {
  /** ===== Inputs ===== */
  const [equity, setEquity] = useState<number>(() => {
    const v = localStorage.getItem(LS_KEYS.equity);
    return v ? Number(v) : 10000;
  });
  const [riskPct, setRiskPct] = useState<number>(1);         // % do equity
  const [tpPct, setTpPct] = useState<number>(0);             // % alvo
  const [slPct, setSlPct] = useState<number>(0);             // % stop
  const [qtyInput, setQtyInput] = useState<number>(1000);    // usado para info, mas o sizing usa risk

  /** ===== Mercado (preço ao vivo) ===== */
  const [price, setPrice] = useState<number>(0);
  const pollRef = useRef<any>(null);

  const fetchPrice = useCallback(async () => {
    try {
      const sym = symToBinance(symbol);
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`, { cache: 'no-store' });
      const data = await res.json();
      const p = Number(data?.price);
      if (!isNaN(p)) setPrice(p);
    } catch {
      // ignora erros intermitentes
    }
  }, [symbol]);

  useEffect(() => {
    fetchPrice();                     // 1ª leitura
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchPrice, 2000); // polling leve
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchPrice]);

  /** ===== Estado de posição / histórico ===== */
  const [position, setPosition] = useState<Position | null>(() => {
    const raw = localStorage.getItem(LS_KEYS.pos);
    return raw ? JSON.parse(raw) as Position : null;
  });

  const [history, setHistory] = useState<Trade[]>(() => {
    const raw = localStorage.getItem(LS_KEYS.hist);
    return raw ? JSON.parse(raw) as Trade[] : [];
  });

  // persistência leve
  useEffect(() => { localStorage.setItem(LS_KEYS.equity, String(equity)); }, [equity]);
  useEffect(() => {
    localStorage.setItem(LS_KEYS.pos, position ? JSON.stringify(position) : '');
  }, [position]);
  useEffect(() => {
    localStorage.setItem(LS_KEYS.hist, JSON.stringify(history));
  }, [history]);

  /** ===== Derivados ===== */
  // tamanho sugerido da posição usando riskPct (alavancagem 1x simplificada)
  const suggestedQty = useMemo(() => {
    if (!price || riskPct <= 0) return 0;
    const riskUSDT = equity * (riskPct / 100);
    // supondo stop de slPct% contra, tamanho = risk / (sl% * price)
    const stopPct = slPct > 0 ? slPct : 1; // assume 1% se SL=0 para não estourar
    const qty = riskUSDT / ((stopPct / 100) * price);
    return qty;
  }, [equity, price, riskPct, slPct]);

  // PnL flutuante
  const floatPnL = useMemo(() => {
    if (!position || !price) return 0;
    const { side, entry, qty } = position;
    const diff = side === 'LONG' ? (price - entry) : (entry - price);
    return diff * qty;
  }, [position, price]);

  const floatPct = useMemo(() => {
    if (!position || !price) return 0;
    const { entry } = position;
    const pct = ((price - entry) / entry) * 100 * (position.side === 'LONG' ? 1 : -1);
    return pct;
  }, [position, price]);

  /** ===== Abertura/fechamento ===== */
  const openPosition = (side: Side) => {
    if (!price) return;
    // se já tem posição:
    if (position) {
      // clicar no lado oposto fecha a posição
      if (position.side !== side) {
        closePosition();
      }
      return;
    }
    const qty = suggestedQty || Math.max(0.0001, (qtyInput / price)); // fallback: usar qtyInput como USDT/price
    const entry = price;
    const p: Position = {
      side,
      symbol,
      entry,
      qty,
      tp: tpPct > 0 ? (side === 'LONG' ? entry * (1 + tpPct / 100) : entry * (1 - tpPct / 100)) : undefined,
      sl: slPct > 0 ? (side === 'LONG' ? entry * (1 - slPct / 100) : entry * (1 + slPct / 100)) : undefined,
      openedAt: nowIso(),
    };
    setPosition(p);
  };

  const closePosition = () => {
    if (!position || !price) return;
    const exit = price;
    const pnl = (position.side === 'LONG' ? (exit - position.entry) : (position.entry - exit)) * position.qty;
    const pnlPct = ((exit - position.entry) / position.entry) * 100 * (position.side === 'LONG' ? 1 : -1);

    // atualiza equity
    setEquity(prev => prev + pnl);

    // registra no histórico
    const tr: Trade = {
      id: crypto.randomUUID(),
      symbol: position.symbol,
      side: position.side,
      entry: position.entry,
      exit,
      pnl,
      pnlPct,
      qty: position.qty,
      openedAt: position.openedAt,
      closedAt: nowIso(),
    };
    setHistory(prev => [tr, ...prev]);

    // limpa posição
    setPosition(null);
  };

  // fecha automático por TP/SL
  useEffect(() => {
    if (!position || !price) return;
    const { tp, sl, side } = position;
    if (tp) {
      const hit = side === 'LONG' ? price >= tp : price <= tp;
      if (hit) closePosition();
    }
    if (sl) {
      const hit = side === 'LONG' ? price <= sl : price >= sl;
      if (hit) closePosition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  /** ===== Reset ===== */
  const resetAll = () => {
    setRiskPct(1);
    setTpPct(0);
    setSlPct(0);
    setQtyInput(1000);
    setPosition(null);
  };

  /** ===== Render ===== */
  return (
    <div className="compactPanel compactRoot" style={{ display: 'grid', gap: 10 }}>
      {/* Linha de status */}
      <div className="kpiGrid">
        <div className="kpiCard">
          <div className="kpiLabel">Preço</div>
          <div className="kpiValue">{price ? fmt2(price) : '—'}</div>
        </div>
        <div className="kpiCard">
          <div className="kpiLabel">Equity</div>
          <div className="kpiValue">{fmt2(equity)} USDT</div>
        </div>
        <div className="kpiCard">
          <div className="kpiLabel">PnL flutuante</div>
          <div className="kpiValue" style={{ color: floatPnL >= 0 ? '#1cff80' : '#ff6b6b' }}>
            {fmt2(floatPnL)} USDT ({fmt2(floatPct)}%)
          </div>
        </div>
      </div>

      {/* TP / SL */}
      <div className="twoCols">
        <div className="cardMini">
          <div className="cardTitle">Take Profit (%)</div>
          <div className="twoCols">
            <input className="inp" type="number" placeholder="%"
              value={tpPct || ''} onChange={e => setTpPct(Number(e.target.value || 0))} />
            <button className="btn" onClick={() => setTpPct(0)}>Zerar</button>
          </div>
        </div>
        <div className="cardMini">
          <div className="cardTitle">Stop Loss (%)</div>
          <div className="twoCols">
            <input className="inp" type="number" placeholder="%"
              value={slPct || ''} onChange={e => setSlPct(Number(e.target.value || 0))} />
            <button className="btn" onClick={() => setSlPct(0)}>Zerar</button>
          </div>
        </div>
      </div>

      {/* Quantidade / Risco / Equity */}
      <div className="threeCols">
        <div className="cardMini">
          <div className="cardTitle">Saldo (USDT)</div>
          <input className="inp" type="number" value={equity}
                 onChange={e => setEquity(Number(e.target.value || 0))} />
          <div className="muted xs">Equity simulado total</div>
        </div>
        <div className="cardMini">
          <div className="cardTitle">Risco por trade (%)</div>
          <input className="inp" type="number" value={riskPct}
                 onChange={e => setRiskPct(Number(e.target.value || 0))} />
          <div className="muted xs">Tamanho sug.: {suggestedQty ? suggestedQty.toFixed(5) : '—'}</div>
        </div>
        <div className="cardMini">
          <div className="cardTitle">USDT p/ referência</div>
          <input className="inp" type="number" value={qtyInput}
                 onChange={e => setQtyInput(Number(e.target.value || 0))} />
          <div className="muted xs">Só usado como fallback p/ qty</div>
        </div>
      </div>

      {/* Símbolo + Reset */}
      <div className="cardMini">
        <div className="cardTitle">Par</div>
        <div className="twoCols">
          <select className="inp" value={symbol} onChange={e => onSymbolChange(e.target.value)}>
            <option>BTCUSDT</option>
            <option>ETHUSDT</option>
            <option>SOLUSDT</option>
            <option>LINKUSDT</option>
            <option>BNBUSDT</option>
            <option>XRPUSDT</option>
            <option>DOGEUSDT</option>
            <option>ADAUSDT</option>
          </select>
          <button className="btn" onClick={resetAll}>Resetar</button>
        </div>
      </div>

      {/* Ações — Comprar/Vender no rodapé */}
      <div className="twoCols" style={{ marginTop: 2 }}>
        <button
          className="btn btnBuy"
          onClick={() => openPosition('LONG')}
          title={position?.side === 'SHORT' ? 'Fechar SHORT' : 'Abrir LONG'}
        >
          {position?.side === 'SHORT' ? 'Fechar Short' : 'Comprar'}
        </button>

        <button
          className="btn btnSell"
          onClick={() => openPosition('SHORT')}
          title={position?.side === 'LONG' ? 'Fechar LONG' : 'Abrir SHORT'}
        >
          {position?.side === 'LONG' ? 'Fechar Long' : 'Vender'}
        </button>
      </div>

      {/* Histórico (render simplificado; o “card” externo já é fornecido pela página) */}
      <div className="cardMini">
        <div className="cardTitle">Histórico recente</div>
        <div className="histWrap">
          {history.length === 0 && <div className="histRow muted xs">Sem operações ainda.</div>}
          {history.map(tr => (
            <div key={tr.id} className="histRow">
              <div className="xs muted">{tr.openedAt} → {tr.closedAt}</div>
              <div className="xs" style={{ marginTop: 4 }}>
                {tr.symbol} • {tr.side} • ent: {fmt2(tr.entry)} • sai: {fmt2(tr.exit)} •
                &nbsp;<strong style={{ color: tr.pnl >= 0 ? '#1cff80' : '#ff6b6b' }}>
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
