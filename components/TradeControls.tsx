'use client';

import React, { useMemo, useState } from 'react';

type Props = {
  symbol: string;
  onSymbolChange: (s: string) => void;
  // Callbacks opcionais — a página decide se grava histórico
  onBuy?: () => void;
  onSell?: () => void;
  onReset?: () => void;
  // Preço "ao vivo" para mostrar no topo do painel
  livePrice?: number;
};

export default function TradeControls({
  symbol,
  onSymbolChange,
  onBuy,
  onSell,
  onReset,
  livePrice = 116823.69,
}: Props) {
  // Estados principais do painel
  const [balance, setBalance] = useState<number>(10000);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [tpPct, setTpPct] = useState<number | ''>('');
  const [slPct, setSlPct] = useState<number | ''>('');
  const [qtyRef, setQtyRef] = useState<number>(1000);

  const sizeSuggestion = useMemo(
    () => (balance * (riskPct / 100)).toFixed(4),
    [balance, riskPct]
  );

  return (
    <div
      className="panel compactPanel compactRoot tradePanelShell"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 24px)',
        overflow: 'auto',
      }}
    >
      {/* Faixa superior (Preço / Equity / PnL / Par) */}
      <div className="cardMini" style={{ marginBottom: 10 }}>
        <div className="twoCols">
          <div>
            <div className="lbl">Preço</div>
            <div className="green">{livePrice.toLocaleString('pt-BR')}</div>
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
        {/* COLUNA A – entradas e ações */}
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
            <button className="btn btnBuy" onClick={onBuy}>
              Comprar
            </button>
            <button className="btn btnSell" onClick={onSell}>
              Vender
            </button>
          </div>
          <button className="btn" onClick={onReset}>
            Resetar
          </button>
        </div>

        {/* COLUNA B – (vazia por enquanto; sem Histórico interno) */}
        <div className="colB" />
      </div>
    </div>
  );
}
