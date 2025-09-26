// /components/TradeControls.tsx
'use client';

import React, { useState } from 'react';

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
  // placeholders (futuros: ligar na sua store/estado real)
  const [riskPct, setRiskPct] = useState<number>(1);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [entryPrice, setEntryPrice] = useState<string>('');

  return (
    <div className="compactRoot" style={{ display: 'grid', gap: 12 }}>
      {/* Cabeçalho do painel com Voltar ao início */}
      <div className="compactHeader">
        <h3 className="compactTitle">Controles de Trade</h3>
        <a href="/" className="btn tcBackBtn">Voltar ao início</a>
      </div>

      {/* Par & preço ao vivo */}
      <div className="twoCols">
        <div>
          <div className="lbl">Par</div>
          <select className="inp" value={symbol} onChange={(e) => onSymbolChange(e.target.value)}>
            {PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <div className="lbl">Preço ao vivo</div>
          <div className="fakeInput">
            {livePrice ? livePrice.toLocaleString('en-US', { maximumFractionDigits: 6 }) : '—'}
          </div>
        </div>
      </div>

      {/* Indicadores principais (placeholders visuais) */}
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

      {/* Parâmetros de trade */}
      <div className="threeCols">
        <div className="cardMini">
          <div className="lbl">Tamanho da posição</div>
          <div className="fakeInput">—</div>
        </div>
        <div className="cardMini">
          <div className="lbl">Preço de entrada</div>
          <input
            className="inp"
            placeholder={livePrice ? livePrice.toString() : '—'}
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
          />
        </div>
        <div className="cardMini">
          <div className="lbl">Risco por trade (%)</div>
          <input
            className="inp"
            type="number"
            min={0}
            step="0.25"
            value={riskPct}
            onChange={(e) => setRiskPct(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="twoCols">
        <div className="cardMini">
          <div className="lbl">Stop Loss</div>
          <input className="inp" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
        </div>
        <div className="cardMini">
          <div className="lbl">Take Profit</div>
          <input className="inp" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} />
        </div>
      </div>

      {/* Ações */}
      <div className="twoCols">
        <button className="btn btnBuy" onClick={() => alert('Comprar (TODO)')}>Comprar</button>
        <button className="btn btnSell" onClick={() => alert('Vender (TODO)')}>Vender</button>
      </div>

      <div className="twoCols">
        <button className="btn" onClick={() => alert('Resetar histórico (TODO)')}>Resetar histórico</button>
        <button className="btn" onClick={() => alert('Exportar CSV (TODO)')}>Exportar CSV</button>
      </div>
    </div>
  );
}
