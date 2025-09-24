'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { priceFeed } from '@/lib/priceFeed';

type Props = {
  symbol: string;
  onSymbolChange: (s: string) => void;
};

type Side = 'BUY' | 'SELL';

type Trade = {
  side: Side;
  symbol: string;
  price: number;
  qty: number;        // quantidade "simulada" (USDT / preço atual)
  ts: number;
};

type Position = {
  symbol: string;
  qty: number;        // quantidade em moeda base (ex.: BTC)
  avgPrice: number;   // preço médio
};

const LS_KEY = 'rc_sim_history_v1';
const LS_POS  = 'rc_sim_position_v1';
const LS_BAL  = 'rc_sim_balance_v1';

export default function TradeControls({ symbol, onSymbolChange }: Props) {
  // ====== Estados principais (mantidos) ======
  const [balance, setBalance] = useState<number>(10000);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [tpPct, setTpPct] = useState<number | ''>('');
  const [slPct, setSlPct] = useState<number | ''>('');
  const [qtyRef, setQtyRef] = useState<number>(1000);

  // ====== Histórico + Posição (persistidos) ======
  const [history, setHistory] = useState<Trade[]>([]);
  const [position, setPosition] = useState<Position>({ symbol, qty: 0, avgPrice: 0 });

  // ====== Preço ao vivo ======
  const [lastPrice, setLastPrice] = useState<number>(NaN);
  const lastSymbol = useRef<string>(symbol);

  // carrega persistência na 1ª vez
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

  // salva alterações
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(history));
  }, [history]);
  useEffect(() => {
    localStorage.setItem(LS_POS, JSON.stringify(position));
  }, [position]);
  useEffect(() => {
    localStorage.setItem(LS_BAL, JSON.stringify(balance));
  }, [balance]);

  // Assina preço ao vivo do símbolo atual
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

  // ====== Execução "simulada" ======
  // convertemos qtyRef (USDT) para quantidade base usando o preço atual.
  const qtyFromUSDT = (usdt: number, price: number) =>
    price > 0 ? usdt / price : 0;

  const execute = (side: Side) => {
    const p = Number.isFinite(lastPrice) ? lastPrice : lastPriceFallback();
    const qtyBase = qtyFromUSDT(qtyRef, p);
    if (qtyBase <= 0) return;

    const trade: Trade = { side, symbol, price: p, qty: qtyBase, ts: Date.now() };
    setHistory((h) => [trade, ...h]);

    setPosition((pos) => {
      if (pos.symbol !== symbol) pos = { symbol, qty: 0, avgPrice: 0 };

      // BUY aumenta qty; SELL reduz qty (posição pode inverter)
      let newQty = pos.qty;
      let newAvg = pos.avgPrice;

      if (side === 'BUY') {
        const totalCost = pos.avgPrice * pos.qty + p * qtyBase;
        newQty = pos.qty + qtyBase;
        newAvg = newQty > 0 ? totalCost / newQty : 0;
      } else { // SELL
        newQty = pos.qty - qtyBase;
        // se zerou ou inverteu, ajusta preço médio
        if (newQty <= 1e-12) {
          newQty = Math.max(0, newQty);
          newAvg = newQty > 0 ? p : 0;
        }
      }
      return { symbol, qty: newQty, avgPrice: newAvg };
    });
  };

  // fallback para preço (caso WS ainda não tenha chegado)
  const lastPriceFallback = () => {
    // se não tiver preço, usa 1 para não quebrar (nunca deve acontecer na prática)
    return Number.isFinite(lastPrice) ? lastPrice : 1;
  };

  const handleBuy  = () => execute('BUY');
  const handleSell = () => execute('SELL');

  const handleReset = () => {
    setHistory([]);
    setPosition({ symbol, qty: 0, avgPrice: 0 });
  };

  // Recalcula PnL flutuante (se a posição for do símbolo atual)
  const { pnlUSDT, pnlPct, equityStr, priceStr } = useMemo(() => {
    const p = Number.isFinite(lastPrice) ? lastPrice : NaN;
    let pnl = 0;
    if (position.symbol === symbol && Number.isFinite(p) && position.qty > 0 && position.avgPrice > 0) {
      pnl = (p - position.avgPrice) * position.qty;
    }
    const eq = balance + pnl;
    return {
      pnlUSDT: pnl,
      pnlPct: position.avgPrice > 0 ? (pnl / (position.avgPrice * position.qty || 1)) * 100 : 0,
      equityStr: `${eq.toFixed(2)} USDT`,
      priceStr: Number.isFinite(p) ? p.toLocaleString('pt-BR') : '—'
    };
  }, [lastPrice, position, balance, symbol]);

  // ====== UI (mantida) ======
  return (
    <div
      className="panel compactPanel compactRoot tradePanelShell"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 24px)',
        overflow: 'hidden', // sem barras
      }}
    >
      {/* Cabeçalho já é controlado no layout externo */}
      {/* Faixa superior (Preço / Equity / PnL / Par) */}
      <div className="cardMini" style={{ marginBottom: 10 }}>
        <div className="twoCols">
          <div>
            <div className="lbl">Preço</div>
            <div className="green">{priceStr}</div>
          </div>
          <div>
            <div className="lbl">Equity</div>
            <div>{equityStr}</div>
          </div>
        </div>
        <div className="twoCols">
          <div>
            <div className="lbl">PNL flutuante</div>
            <div>
              {pnlUSDT.toFixed(2)} USDT ({isFinite(pnlPct) ? pnlPct.toFixed(2) : '0.00'}%)
            </div>
          </div>
          <div>
            <div className="lbl">Par</div>
            <select
              className="inp"
              value={symbol}
              onChange={(e) => onSymbolChange(e.target.value)}
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
        </div>
      </div>

      {/* Grid principal */}
      <div className="compactGrid">
        {/* COLUNA A */}
        <div className="colA">
          {/* TP / SL */}
          <div className="twoCols">
            <div className="cardMini">
              <div className="cardTitle">Take Profit (%)</div>
              <div className="twoCols">
                <input
                  className="inp"
                  type="number"
                  placeholder="%"
                  value={tpPct === '' ? '' : tpPct}
                  onChange={(e) =>
                    setTpPct(e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
                <button className="btn" onClick={() => setTpPct('')}>
                  Zerar
                </button>
              </div>
            </div>
            <div className="cardMini">
              <div className="cardTitle">Stop Loss (%)</div>
              <div className="twoCols">
                <input
                  className="inp"
                  type="number"
                  placeholder="%"
                  value={slPct === '' ? '' : slPct}
                  onChange={(e) =>
                    setSlPct(e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
                <button className="btn" onClick={() => setSlPct('')}>
                  Zerar
                </button>
              </div>
            </div>
          </div>

          {/* Saldo / Risco / USDT ref */}
          <div className="threeCols">
            <div className="cardMini">
              <div className="cardTitle">Saldo (USDT)</div>
              <input
                className="inp"
                type="number"
                min={0}
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
              />
              <div className="xs muted">Equity simulado total</div>
            </div>
            <div className="cardMini">
              <div className="cardTitle">Risco por trade (%)</div>
              <input
                className="inp"
                type="number"
                min={0}
                value={riskPct}
                onChange={(e) => setRiskPct(Number(e.target.value))}
              />
              <div className="xs muted">Tamanho sug.: {sizeSuggestion}</div>
            </div>
            <div className="cardMini">
              <div className="cardTitle">USDT p/ referência</div>
              <input
                className="inp"
                type="number"
                min={0}
                value={qtyRef}
                onChange={(e) => setQtyRef(Number(e.target.value))}
              />
              <div className="xs muted">Usado só como fallback p/ qty</div>
            </div>
          </div>

          {/* Ações */}
          <div className="twoCols">
            <button className="btn btnBuy" onClick={handleBuy}>
              Comprar
            </button>
            <button className="btn btnSell" onClick={handleSell}>
              Vender
            </button>
          </div>
          <button className="btn" onClick={handleReset}>
            Resetar
          </button>
        </div>

        {/* COLUNA B */}
        <div className="colB">
          {/* Histórico ÚNICO */}
          <div className="cardMini historyCard" style={{ minHeight: 0 }}>
            <div className="cardTitle">Histórico</div>
            <div className="histWrap">
              {history.length === 0 && (
                <div className="histRow">Sem operações ainda.</div>
              )}
              {history.map((h, i) => (
                <div className="histRow" key={i}>
                  {new Date(h.ts).toLocaleString('pt-BR')} — {h.side}{' '}
                  {h.symbol} @ {h.price.toLocaleString('pt-BR')} (qty:{' '}
                  {h.qty.toFixed(6)})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
