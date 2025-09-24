'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { priceFeed } from '@/lib/priceFeed';

type Props = {
  symbol: string;
  onSymbolChange: (s: string) => void;
  onFullscreen?: () => void;
};

type Side = 'BUY' | 'SELL';

type Trade = {
  side: Side;
  symbol: string;
  price: number;
  qty: number;        // quantidade em moeda base (ex.: BTC)
  ts: number;
};

type Position = {
  symbol: string;
  qty: number;        // quantidade em moeda base
  avgPrice: number;   // preço médio
};

const LS_KEY = 'rc_sim_history_v1';
const LS_POS = 'rc_sim_position_v1';
const LS_BAL = 'rc_sim_balance_v1';
const FEE = 0.0005;   // 0.05% por lado (ajuste se desejar)

export default function TradeControls({ symbol, onSymbolChange, onFullscreen }: Props) {
  // ===== Estados principais (mantidos) =====
  const [balance, setBalance] = useState<number>(10000);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [tpPct, setTpPct] = useState<number | ''>('');
  const [slPct, setSlPct] = useState<number | ''>('');
  const [qtyRef, setQtyRef] = useState<number>(1000);

  // ===== Histórico + Posição (persistidos) =====
  const [history, setHistory] = useState<Trade[]>([]);
  const [position, setPosition] = useState<Position>({ symbol, qty: 0, avgPrice: 0 });

  // ===== Preço ao vivo =====
  const [lastPrice, setLastPrice] = useState<number>(NaN);
  const lastSymbol = useRef<string>(symbol);

  // Carrega do localStorage
  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem(LS_KEY) || '[]') as Trade[];
      const p = JSON.parse(localStorage.getItem(LS_POS) || '{}') as Position;
      const b = JSON.parse(localStorage.getItem(LS_BAL) || '10000');
      if (Array.isArray(h)) setHistory(h);
      if (p && typeof p === 'object' && p.symbol) setPosition(p);
      if (typeof b === 'number') setBalance(b);
    } catch {}
  }, []);

  // Persiste
  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem(LS_POS, JSON.stringify(position)); }, [position]);
  useEffect(() => { localStorage.setItem(LS_BAL, JSON.stringify(balance)); }, [balance]);

  // Assina preço ao vivo do símbolo
  useEffect(() => {
    lastSymbol.current = symbol;
    setLastPrice(NaN);
    const unsub = priceFeed.subscribe(symbol, (p) => setLastPrice(p));
    return () => unsub?.();
  }, [symbol]);

  // Sugestão de tamanho em USDT (mantida)
  const sizeSuggestion = useMemo(
    () => (balance * (riskPct / 100)).toFixed(4),
    [balance, riskPct]
  );

  // Helpers
  const validPrice = Number.isFinite(lastPrice) && lastPrice > 0 ? lastPrice : NaN;
  const qtyFromUSDT = (usdt: number, price: number) => (price > 0 ? usdt / price : 0);

  // Execução simulada
  const execute = (side: Side) => {
    if (!Number.isFinite(validPrice)) return;
    const p = validPrice;

    // converte qtyRef (USDT) -> base (ex.: BTC); aplica fee de entrada
    const grossQty = qtyFromUSDT(qtyRef, p);
    const netQty = grossQty * (1 - FEE);
    if (netQty <= 0) return;

    const t: Trade = { side, symbol, price: p, qty: netQty, ts: Date.now() };
    setHistory((h) => [t, ...h]);

    setPosition((pos) => {
      let base = pos;
      if (pos.symbol !== symbol) base = { symbol, qty: 0, avgPrice: 0 };

      if (side === 'BUY') {
        const newQty = base.qty + netQty;
        const totalCost = base.avgPrice * base.qty + p * netQty * (1 + FEE); // custo com fee
        const newAvg = newQty > 0 ? totalCost / newQty : 0;
        return { symbol, qty: newQty, avgPrice: newAvg };
      } else {
        // SELL: reduz posição; aplica fee de saída no cálculo de qty efetiva
        let newQty = base.qty - netQty;
        if (newQty <= 1e-12) {
          // posição zerada ou invertida
          newQty = Math.max(0, newQty);
          return { symbol, qty: newQty, avgPrice: newQty > 0 ? p : 0 };
        }
        // posição ainda positiva
        return { symbol, qty: newQty, avgPrice: base.avgPrice };
      }
    });
  };

  const handleBuy = () => execute('BUY');
  const handleSell = () => execute('SELL');

  const handleReset = () => {
    setHistory([]);
    setPosition({ symbol, qty: 0, avgPrice: 0 });
  };

  // TP/SL (fechamento total se atingir)
  useEffect(() => {
    if (!Number.isFinite(validPrice)) return;
    if (position.symbol !== symbol || position.qty <= 0 || position.avgPrice <= 0) return;

    const p = validPrice;
    const tpHit = tpPct !== '' ? p >= position.avgPrice * (1 + Number(tpPct) / 100) : false;
    const slHit = slPct !== '' ? p <= position.avgPrice * (1 - Number(slPct) / 100) : false;

    if (tpHit || slHit) {
      // simula venda total
      const side: Side = 'SELL';
      const netQty = position.qty * (1 - FEE);
      const t: Trade = { side, symbol, price: p, qty: netQty, ts: Date.now() };
      setHistory((h) => [t, ...h]);
      setPosition({ symbol, qty: 0, avgPrice: 0 });
    }
  }, [validPrice, position, symbol, tpPct, slPct]);

  // Recalcula PnL/Equity
  const { pnlUSDT, pnlPct, equityStr, priceStr } = useMemo(() => {
    const p = validPrice;
    let pnl = 0;
    if (position.symbol === symbol && Number.isFinite(p) && position.qty > 0 && position.avgPrice > 0) {
      // PnL em USDT considerando preço atual (fees já afetaram avg/qty)
      pnl = (p - position.avgPrice) * position.qty;
    }
    const eq = balance + pnl;
    return {
      pnlUSDT: pnl,
      pnlPct: position.avgPrice > 0 ? (pnl / (position.avgPrice * (position.qty || 1))) * 100 : 0,
      equityStr: `${eq.toFixed(2)} USDT`,
      priceStr: Number.isFinite(p) ? p.toLocaleString('pt-BR') : '—'
    };
  }, [validPrice, position, balance, symbol]);

  // ===== UI (idêntica ao seu layout) =====
  return (
    <div
      className="panel compactPanel compactRoot tradePanelShell"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}
    >
      {/* Cabeçalho (mantido) */}
      <div
        className="compactHeader"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
      >
        <h3 className="compactTitle" style={{ margin: 0 }}>
          Controles de Trade
        </h3>

        {/* Botão tela cheia — ícone clássico (quatro setas) */}
        {onFullscreen && (
          <button
            type="button"
            onClick={onFullscreen}
            aria-label="Tela cheia"
            title="Tela cheia (F) / Sair (X)"
            className="chartFsBtn"
            style={{
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
            </svg>
          </button>
        )}
      </div>

      {/* GRID 2×N compacto (mantido) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexGrow: 1 }}>
        {/* Linha 1 — Preço (esq) | Voltar ao início (dir) */}
        <div>
          <div className="lbl">Preço</div>
          <div className="green">{priceStr}</div>
        </div>
        <div>
          <a href="/" className="btn btn-primary" style={{ width: '100%' }}>
            Voltar ao início
          </a>
        </div>

        {/* Linha 2 */}
        <div>
          <div className="lbl">Equity</div>
          <div>{equityStr}</div>
        </div>
        <div>
          <div className="lbl">PNL flutuante</div>
          <div>{pnlUSDT.toFixed(2)} USDT ({isFinite(pnlPct) ? pnlPct.toFixed(2) : '0.00'}%)</div>
        </div>

        {/* Linha 3 */}
        <div>
          <div className="lbl">Stop Loss (%)</div>
          <div className="twoCols">
            <input
              className="inp"
              type="number"
              placeholder="%"
              value={slPct === '' ? '' : slPct}
              onChange={(e) => setSlPct(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <button className="btn" onClick={() => setSlPct('')}>Zerar</button>
          </div>
        </div>
        <div>
          <div className="lbl">Saldo (USDT)</div>
          <input
            className="inp" type="number" min={0} value={balance}
            onChange={(e) => setBalance(Number(e.target.value))}
          />
        </div>

        {/* Linha 4 */}
        <div>
          <div className="lbl">Risco por trade (%)</div>
          <input
            className="inp" type="number" min={0} value={riskPct}
            onChange={(e) => setRiskPct(Number(e.target.value))}
          />
          <div className="xs muted">Tamanho sug.: {sizeSuggestion}</div>
        </div>
        <div>
          <div className="lbl">USDT p/ referência</div>
          <input
            className="inp" type="number" min={0} value={qtyRef}
            onChange={(e) => setQtyRef(Number(e.target.value))}
          />
        </div>

        {/* Linha 5 */}
        <div>
          <div className="lbl">Take Profit (%)</div>
          <div className="twoCols">
            <input
              className="inp" type="number" placeholder="%"
              value={tpPct === '' ? '' : tpPct}
              onChange={(e) => setTpPct(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <button className="btn" onClick={() => setTpPct('')}>Zerar</button>
          </div>
        </div>
        <div>
          <div className="lbl">Par</div>
          <select
            className="inp" value={symbol} onChange={(e) => onSymbolChange(e.target.value)}
          >
            <option>BTCUSDT</option>
            <option>ETHUSDT</option>
            <option>SOLUSDT</option>
            <option>BNBUSDT</option>
            <option>XRPUSDT</option>
            <option>ADAUSDT</option>
            <option>LINKUSDT</option>
            <option>DOGEUSDT</option>
          </select>
        </div>

        {/* Linha 6 – Botões */}
        <div>
          <button className="btn btnBuy" onClick={handleBuy} style={{ width: '100%' }}>
            Comprar
          </button>
        </div>
        <div>
          <button className="btn btnSell" onClick={handleSell} style={{ width: '100%' }}>
            Vender
          </button>
        </div>

        {/* Linha 7 – Reset */}
        <div style={{ gridColumn: '1 / span 2' }}>
          <button className="btn" onClick={handleReset} style={{ width: '100%' }}>
            Resetar
          </button>
        </div>
      </div>

      {/* Histórico no rodapé (mantido) */}
      <div className="cardMini historyCard" style={{ marginTop: 8 }}>
        <div className="cardTitle">Histórico</div>
        <div className="histWrap">
          {history.length === 0 && (<div className="histRow">Sem operações ainda.</div>)}
          {history.map((h, i) => (
            <div className="histRow" key={i}>
              {new Date(h.ts).toLocaleString('pt-BR')} — {h.side} {h.symbol} @{' '}
              {h.price.toLocaleString('pt-BR')} (qty: {h.qty.toFixed(6)})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
