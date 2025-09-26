'use client';

import React, { useState } from 'react';

type Props = {
  symbol: string;
  onSymbolChange: (s: string) => void;
  livePrice?: number;
};

const PAIRS = [
  'BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT',
  'ADAUSDT','XRPUSDT','DOGEUSDT','DOTUSDT',
] as const;

export default function TradeControls({ symbol, onSymbolChange, livePrice }: Props) {
  const [riskPct, setRiskPct] = useState<number>(1);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');

  // tamanhos ↑ para ocupar bem a coluna, mas sem quebrar no zoom 100%
  const compact: React.CSSProperties = { gap: 12, fontSize: 14 };
  const inp: React.CSSProperties = { height: 38, fontSize: 14, padding: '0 12px', width: '100%' };
  const fake: React.CSSProperties = { height: 38, display: 'grid', alignItems: 'center', padding: '0 12px' };

  return (
    <div className="compactRoot" style={{ display: 'grid', ...compact }}>
      {/* Cabeçalho com “Voltar ao início” no canto direito */}
      <div className="tcHeader" style={{ gap: 12 }}>
        <h3 className="compactTitle" style={{ margin: 0 }}>Controles de Trade</h3>
        <a href="/" className="btn tcBackBtn" style={{ marginLeft: 'auto' }}>
          Voltar ao início
        </a>
      </div>

      {/* Linha 1: Par + PNL */}
      <div className="twoCols" style={compact}>
        <div>
          <div className="lbl">Par</div>
          <select
            className="inp"
            style={inp}
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
          >
            {PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <div className="lbl">PNL</div>
          <div className="fakeInput" style={fake}>—</div>
        </div>
      </div>

      {/* Linha 2: Equity + Tamanho da posição */}
      <div className="twoCols" style={compact}>
        <div>
          <div className="lbl">Equity</div>
          <div className="fakeInput" style={fake}>—</div>
        </div>
        <div>
          <div className="lbl">Tamanho da posição</div>
          <div className="fakeInput" style={fake}>—</div>
        </div>
      </div>

      {/* Linha 3: Take Profit + Stop Loss */}
      <div className="twoCols" style={compact}>
        <div>
          <div className="lbl">Take Profit</div>
          <input className="inp" style={inp} value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} />
        </div>
        <div>
          <div className="lbl">Stop Loss</div>
          <input className="inp" style={inp} value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
        </div>
      </div>

      {/* Linha 4: Variação 24h + Volume 24h */}
      <div className="twoCols" style={compact}>
        <div>
          <div className="lbl">Variação 24h</div>
          <div className="fakeInput" style={fake}>—</div>
        </div>
        <div>
          <div className="lbl">Volume 24h</div>
          <div className="fakeInput" style={fake}>—</div>
        </div>
      </div>

      {/* Linha 5: Spread + Risco por trade (%) */}
      <div className="twoCols" style={compact}>
        <div>
          <div className="lbl">Spread</div>
          <div className="fakeInput" style={fake}>—</div>
        </div>
        <div>
          <div className="lbl">Risco por trade (%)</div>
          <input
            className="inp"
            style={inp}
            type="number"
            min={0}
            step="0.25"
            value={riskPct}
            onChange={(e) => setRiskPct(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Ações (sempre visíveis no 100%) */}
      <div className="twoCols" style={compact}>
        <button className="btn btnBuy">Comprar</button>
        <button className="btn btnSell">Vender</button>
      </div>
      <div className="twoCols" style={compact}>
        <button className="btn">Resetar histórico</button>
        <button className="btn">Exportar CSV</button>
      </div>
    </div>
  );
}
