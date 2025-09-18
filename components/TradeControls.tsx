'use client';

import { useState } from 'react';

type Props = {
  symbol: string;
  onSymbolChange: (s: string) => void;
};

export default function TradeControls({ symbol, onSymbolChange }: Props) {
  const [qty, setQty] = useState<number>(1000);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [tpPct, setTpPct] = useState<number>(0);
  const [slPct, setSlPct] = useState<number>(0);

  const handleQty = (v: string) => setQty(Number(v || 0));
  const handleRisk = (v: string) => setRiskPct(Number(v || 0));
  const handleTp = (v: string) => setTpPct(Number(v || 0));
  const handleSl = (v: string) => setSlPct(Number(v || 0));

  const buy = () => {/* lógica de compra local */};
  const sell = () => {/* lógica de venda local */};
  const reset = () => { setQty(1000); setRiskPct(1); setTpPct(0); setSlPct(0); };

  return (
    <div className="compactPanel compactRoot" style={{ display: 'grid', gap: 10 }}>
      {/* TP / SL */}
      <div className="twoCols">
        <div className="cardMini">
          <div className="cardTitle">Take Profit</div>
          <div className="twoCols">
            <input className="inp" type="number" placeholder="%"
                   value={tpPct || ''} onChange={e => handleTp(e.target.value)} />
            <button className="btn" onClick={() => setTpPct(0)}>Zerar</button>
          </div>
        </div>
        <div className="cardMini">
          <div className="cardTitle">Stop Loss</div>
          <div className="twoCols">
            <input className="inp" type="number" placeholder="%"
                   value={slPct || ''} onChange={e => handleSl(e.target.value)} />
            <button className="btn" onClick={() => setSlPct(0)}>Zerar</button>
          </div>
        </div>
      </div>

      {/* Quantidade / Risco */}
      <div className="twoCols">
        <div className="cardMini">
          <div className="cardTitle">Saldo (USDT)</div>
          <input className="inp" type="number" value={qty} onChange={e => handleQty(e.target.value)} />
          <div className="muted xs">Risco estimado: {(qty * (riskPct / 100)).toFixed(2)} USDT</div>
        </div>
        <div className="cardMini">
          <div className="cardTitle">Risco por trade (%)</div>
          <input className="inp" type="number" value={riskPct} onChange={e => handleRisk(e.target.value)} />
        </div>
      </div>

      {/* Símbolo + Reset */}
      <div className="cardMini">
        <div className="cardTitle">Par</div>
        <div className="twoCols">
          <select
            className="inp"
            value={symbol}
            onChange={e => onSymbolChange(e.target.value)}
          >
            <option>BTCUSDT</option>
            <option>ETHUSDT</option>
            <option>SOLUSDT</option>
            <option>LINKUSDT</option>
            <option>BNBUSDT</option>
            <option>XRPUSDT</option>
            <option>DOGEUSDT</option>
            <option>ADAUSDT</option>
          </select>
          <button className="btn" onClick={reset}>Resetar</button>
        </div>
      </div>

      {/* AÇÕES PRIMÁRIAS NO RODAPÉ */}
      <div className="twoCols" style={{ marginTop: 2 }}>
        <button className="btn btnBuy" onClick={buy}>Comprar</button>
        <button className="btn btnSell" onClick={sell}>Vender</button>
      </div>
    </div>
  );
}
