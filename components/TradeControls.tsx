// components/TradeControls.tsx
"use client";

import { useState } from "react";

type Props = {
  symbol: string;
  onSymbolChange?: (s: string) => void;
};

const ALL_PAIRS = ["BTCUSDT", "ETHUSDT", "BNBUSDT"] as const;

export default function TradeControls({ symbol, onSymbolChange }: Props) {
  const [riskPct, setRiskPct] = useState<number>(1);
  const [stake, setStake] = useState<number>(1000);

  return (
    <section className="panel" aria-label="Controles de Trade">
      <div className="compactHeader">
        <h3 className="compactTitle">Controles de Trade</h3>
        {/* (opcional) ações rápidas no cabeçalho */}
      </div>

      <div className="cardMini" style={{ gap: 10 }}>
        {/* PAR */}
        <div>
          <div className="lbl">Par</div>
          <div className="pairsRow">
            {ALL_PAIRS.map((p) => (
              <button
                key={p}
                className={`chip ${p === symbol ? "chip-active" : ""}`}
                onClick={() => onSymbolChange?.(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Stake (USDT) */}
        <div className="twoCols">
          <div>
            <div className="lbl">USDT por operação</div>
            <input
              className="inp"
              type="number"
              value={stake}
              min={0}
              onChange={(e) => setStake(Number(e.target.value))}
            />
          </div>
          <div>
            <div className="lbl">Risco por trade (%)</div>
            <input
              className="inp"
              type="number"
              value={riskPct}
              min={0}
              max={100}
              onChange={(e) => setRiskPct(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Ações */}
        <div className="twoCols">
          <button className="btn btnBuy">Comprar</button>
          <button className="btn btnSell">Vender</button>
        </div>

        {/* Histórico (apenas placeholder — mantém o padrão do seu CSS) */}
        <div className="historyCard">
          <div className="lbl">Histórico</div>
          <div className="cardMini muted xs">Sem operações ainda.</div>
        </div>
      </div>
    </section>
  );
}
