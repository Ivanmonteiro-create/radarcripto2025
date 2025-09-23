'use client';

import React, { useMemo, useState } from 'react';

type Props = {
  symbol: string;
  onSymbolChange: (s: string) => void;
  onFullscreen?: () => void;
};

export default function TradeControls({ symbol, onSymbolChange, onFullscreen }: Props) {
  const [balance, setBalance] = useState<number>(10000);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [tpPct, setTpPct] = useState<number | ''>('');
  const [slPct, setSlPct] = useState<number | ''>('');
  const [qtyRef, setQtyRef] = useState<number>(1000);
  const [history, setHistory] = useState<
    { side: 'BUY' | 'SELL'; symbol: string; price: number; ts: number }[]
  >([]);

  const price = useMemo(() => 116823.69, []);
  const sizeSuggestion = useMemo(
    () => (balance * (riskPct / 100)).toFixed(4),
    [balance, riskPct]
  );

  const handleBuy = () =>
    setHistory((h) => [{ side: 'BUY', symbol, price, ts: Date.now() }, ...h]);
  const handleSell = () =>
    setHistory((h) => [{ side: 'SELL', symbol, price, ts: Date.now() }, ...h]);
  const handleReset = () => setHistory([]);

  return (
    <div
      className="panel compactPanel compactRoot tradePanelShell"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: 8,
      }}
    >
      {/* Cabeçalho */}
      <div
        className="compactHeader"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3 className="compactTitle" style={{ margin: 0 }}>
          Controles de Trade
        </h3>
        {onFullscreen && (
          <button
            type="button"
            onClick={onFullscreen}
            aria-label="Tela cheia"
            title="Tela cheia (F) / Sair (X)"
            className="chartFsBtn"
          >
            ⛶
          </button>
        )}
      </div>

      {/* GRID 2×N compacto */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          flexGrow: 1,
        }}
      >
        {/* Linha 1 */}
        <div>
          <a href="/" className="btn btn-primary" style={{ width: '100%' }}>
            Voltar ao início
          </a>
        </div>
        <div>
          <div className="lbl">Preço</div>
          <div className="green">{price.toLocaleString('pt-BR')}</div>
        </div>

        {/* Linha 2 */}
        <div>
          <div className="lbl">Equity</div>
          <div>10000.00 USDT</div>
        </div>
        <div>
          <div className="lbl">PNL flutuante</div>
          <div>0.00 USDT (0.00%)</div>
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
              onChange={(e) =>
                setSlPct(e.target.value === '' ? '' : Number(e.target.value))
              }
            />
            <button className="btn" onClick={() => setSlPct('')}>
              Zerar
            </button>
          </div>
        </div>
        <div>
          <div className="lbl">Saldo (USDT)</div>
          <input
            className="inp"
            type="number"
            min={0}
            value={balance}
            onChange={(e) => setBalance(Number(e.target.value))}
          />
        </div>

        {/* Linha 4 */}
        <div>
          <div className="lbl">Risco por trade (%)</div>
          <input
            className="inp"
            type="number"
            min={0}
            value={riskPct}
            onChange={(e) => setRiskPct(Number(e.target.value))}
          />
          <div className="xs muted">Tamanho sug.: {sizeSuggestion}</div>
        </div>
        <div>
          <div className="lbl">USDT p/ referência</div>
          <input
            className="inp"
            type="number"
            min={0}
            value={qtyRef}
            onChange={(e) => setQtyRef(Number(e.target.value))}
          />
        </div>

        {/* Linha 5 */}
        <div>
          <div className="lbl">Take Profit (%)</div>
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

      {/* Histórico no rodapé */}
      <div className="cardMini historyCard" style={{ marginTop: 8 }}>
        <div className="cardTitle">Histórico</div>
        <div className="histWrap">
          {history.length === 0 && (
            <div className="histRow">Sem operações ainda.</div>
          )}
          {history.map((h, i) => (
            <div className="histRow" key={i}>
              {new Date(h.ts).toLocaleString('pt-BR')} — {h.side} {h.symbol} @{' '}
              {h.price.toLocaleString('pt-BR')}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
