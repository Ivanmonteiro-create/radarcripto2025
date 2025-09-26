'use client';

import React from 'react';

type Pair =
  | 'BTCUSDT' | 'ETHUSDT' | 'BNBUSDT' | 'SOLUSDT'
  | 'ADAUSDT' | 'XRPUSDT' | 'DOGEUSDT' | 'LINKUSDT'; // ← DOT removido, LINK adicionado

type Props = {
  symbol: Pair;
  onSymbolChange: (sym: string) => void;
  livePrice?: number;
};

export default function TradeControls({ symbol, onSymbolChange, livePrice }: Props) {
  return (
    <div className="compactRoot" style={{ display: 'grid', gap: 10 }}>
      <div className="compactHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="compactTitle" style={{ margin: 0 }}>Controles de Trade</h3>
        <span className="badge">Plano: Free</span>
      </div>

      {/* Par + Preço ao vivo */}
      <div className="twoCols">
        <div className="field">
          <label className="lbl">Par</label>
          <select
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
            className="inp"
          >
            <option value="BTCUSDT">BTC/USDT</option>
            <option value="ETHUSDT">ETH/USDT</option>
            <option value="BNBUSDT">BNB/USDT</option>
            <option value="SOLUSDT">SOL/USDT</option>
            <option value="ADAUSDT">ADA/USDT</option>
            <option value="XRPUSDT">XRP/USDT</option>
            <option value="DOGEUSDT">DOGE/USDT</option>
            <option value="LINKUSDT">LINK/USDT</option>
          </select>
        </div>
        <div className="field">
          <label className="lbl">Preço ao vivo</label>
          <div className="fakeInput">{livePrice ? livePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '—'}</div>
        </div>
      </div>

      {/* Métricas (duas colunas) */}
      <div className="twoCols">
        <div className="field">
          <label className="lbl">PNL</label>
          <div className="fakeInput">—</div>
        </div>
        <div className="field">
          <label className="lbl">Equity</label>
          <div className="fakeInput">—</div>
        </div>
      </div>

      <div className="twoCols">
        <div className="field">
          <label className="lbl">Tamanho de posição</label>
          <div className="fakeInput">—</div>
        </div>
        <div className="field">
          <label className="lbl">Risco por trade (%)</label>
          <div className="fakeInput">1</div>
        </div>
      </div>

      <div className="twoCols">
        <div className="field">
          <label className="lbl">Take Profit</label>
          <div className="fakeInput">—</div>
        </div>
        <div className="field">
          <label className="lbl">Stop Loss</label>
          <div className="fakeInput">—</div>
        </div>
      </div>

      <div className="twoCols">
        <div className="field">
          <label className="lbl">Volume 24h</label>
          <div className="fakeInput">—</div>
        </div>
        <div className="field">
          <label className="lbl">Spread</label>
          <div className="fakeInput">—</div>
        </div>
      </div>

      {/* Ações */}
      <div className="twoCols">
        <button className="btn btnBuy">Comprar</button>
        <button className="btn btnSell">Vender</button>
      </div>

      <div className="twoCols">
        <button className="btn">Resetar histórico</button>
        <button className="btn">Exportar CSV</button>
      </div>
    </div>
  );
}
