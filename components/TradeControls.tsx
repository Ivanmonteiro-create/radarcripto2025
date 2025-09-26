// /components/TradeControls.tsx
'use client';

import React from 'react';

type Props = {
  symbol: string;
  onSymbolChange: (s: string) => void;
  livePrice?: number;
};

const PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT',
  'ADAUSDT', 'XRPUSDT', 'DOGEUSDT', 'DOTUSDT',
] as const;

export default function TradeControls({ symbol, onSymbolChange, livePrice }: Props) {
  return (
    <div className="compactRoot" style={{ display: 'grid', gap: 12 }}>
      <div className="compactHeader">
        <h3 className="compactTitle">Controles de Trade</h3>
      </div>

      {/* Par & preço ao vivo */}
      <div className="twoCols">
        <div>
          <div className="lbl">Par</div>
          <select
            className="inp"
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
          >
            {PAIRS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="lbl">Preço ao vivo</div>
          <div className="fakeInput">
            {livePrice ? livePrice.toLocaleString('en-US', { maximumFractionDigits: 6 }) : '—'}
          </div>
        </div>
      </div>

      {/* Linha de ações (placeholders) */}
      <div className="twoCols">
        <button className="btn btnBuy">Comprar</button>
        <button className="btn btnSell">Vender</button>
      </div>

      <div className="twoCols">
        <button className="btn" onClick={() => alert('Resetar histórico (TODO)')}>Resetar histórico</button>
        <button className="btn" onClick={() => alert('Exportar CSV (TODO)')}>Exportar CSV</button>
      </div>

      {/* Indicadores rápidos (placeholders visuais) */}
      <div className="threeCols">
        <div className="cardMini">
          <div className="lbl">PNL</div>
          <div className="fakeInput">—</div>
        </div>
        <div className="cardMini">
          <div className="lbl">Saldo (USDT)</div>
          <div className="fakeInput">100,000.00</div>
        </div>
        <div className="cardMini">
          <div className="lbl">Equity</div>
          <div className="fakeInput">—</div>
        </div>
      </div>
    </div>
  );
}
