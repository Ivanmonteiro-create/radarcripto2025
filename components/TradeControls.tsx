'use client';

import React, { useMemo, useState } from 'react';

type Props = {
  symbol: string;
  onSymbolChange: (s: string) => void;
  onFullscreen?: () => void; // <-- NOVO: deixa o botão FS opcional
};

export default function TradeControls({ symbol, onSymbolChange, onFullscreen }: Props) {
  // Estados principais (base B)
  const [balance, setBalance] = useState<number>(10000);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [tpPct, setTpPct] = useState<number | ''>('');
  const [slPct, setSlPct] = useState<number | ''>('');
  const [qtyRef, setQtyRef] = useState<number>(1000);

  // Histórico ÚNICO
  const [history, setHistory] = useState<
    { side: 'BUY' | 'SELL'; symbol: string; price: number; ts: number }[]
  >([]);

  // Mock de preço “ao vivo” (placeholder)
  const price = useMemo(() => 116823.69, []);

  const sizeSuggestion = useMemo(
    () => (balance * (riskPct / 100)).toFixed(4),
    [balance, riskPct]
  );

  const handleBuy = () => {
    setHistory((h) => [{ side: 'BUY', symbol, price, ts: Date.now() }, ...h]);
  };
  const handleSell = () => {
    setHistory((h) => [{ side: 'SELL', symbol, price, ts: Date.now() }, ...h]);
  };
  const handleReset = () => {
    setHistory([]);
  };

  return (
    <div
      className="panel compactPanel compactRoot tradePanelShell"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        /* Mantém tudo visível; se faltar espaço, rola apenas o painel */
        maxHeight: 'calc(100vh - 24px)',
        overflow: 'auto',
      }}
    >
      {/* ===== Cabeçalho (título + botão FS opcional) ===== */}
      <div
        className="compactHeader"
        style={{
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <h3 className="compactTitle" style={{ margin: 0 }}>
          Controles de Trade
        </h3>

        {/* Botão de Tela Cheia só aparece se a prop existir */}
        {onFullscreen && (
          <button
            type="button"
            onClick={onFullscreen}
            aria-label="Tela cheia"
            title="Tela cheia (F) / Sair (X)"
            className="chartFsBtn"
            style={{
              position: 'relative',
              top: 0,
              right: 0,
              width: 28,
              height: 28,
              lineHeight: '28px',
              borderRadius: 8,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(255,255,255,.12)',
              color: '#e6e6e6',
              border: '1px solid rgba(255,255,255,.25)',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Faixa superior (Preço / Equity / PnL / Par) */}
      <div className="cardMini" style={{ marginBottom: 10 }}>
        <div className="twoCols">
          <div>
            <div className="lbl">Preço</div>
            <div className="green">{price.toLocaleString('pt-BR')}</div>
          </div>
          <div>
            <div className="lbl">Equity</div>
            <div>10000.00 USDT</div>
          </div>
        </div>
        <div className="twoCols">
          <div>
            <div className="lbl">PNL flutuante</div>
            <div>0.00 USDT (0.00%)</div>
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
                  {new Date(h.ts).toLocaleString('pt-BR')} — {h.side} {h.symbol} @{' '}
                  {h.price.toLocaleString('pt-BR')}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
