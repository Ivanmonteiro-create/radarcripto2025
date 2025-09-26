"use client";

import React, { useMemo, useState } from "react";

/** ===== Pares (8) ===== */
export type Pair =
  | "BTCUSDT"
  | "ETHUSDT"
  | "BNBUSDT"
  | "SOLUSDT"
  | "ADAUSDT"
  | "XRPUSDT"
  | "DOGEUSDT"
  | "LINKUSDT";

const PAIRS: Pair[] = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "ADAUSDT",
  "XRPUSDT",
  "DOGEUSDT",
  "LINKUSDT",
];

/** ===== Props ===== */
type Props = {
  symbol: Pair;
  onSymbolChange?: (s: Pair) => void;

  livePrice?: number;

  pnl?: number;
  equity?: number;
  balance?: number;

  onBuy?: (p: {
    symbol: Pair;
    price?: number;
    sizeUSDT: number;
    riskPct: number;
    tpPrice?: number;
    slPrice?: number;
  }) => void;

  onSell?: (p: {
    symbol: Pair;
    price?: number;
    sizeUSDT: number;
    riskPct: number;
    tpPrice?: number;
    slPrice?: number;
  }) => void;

  onResetHistory?: () => void;
  onExportCSV?: () => void;
};

export default function TradeControls({
  symbol,
  onSymbolChange,
  livePrice,
  pnl = 0,
  equity,
  balance,
  onBuy,
  onSell,
  onResetHistory,
  onExportCSV,
}: Props) {
  const [riskPct, setRiskPct] = useState<number>(1);
  const [sizeUSDT, setSizeUSDT] = useState<number>(100_000);
  const [tpPrice, setTpPrice] = useState<number | undefined>();
  const [slPrice, setSlPrice] = useState<number | undefined>();

  const positionSize = useMemo(() => {
    const px = livePrice && livePrice > 0 ? livePrice : 1;
    return sizeUSDT / px;
  }, [sizeUSDT, livePrice]);

  const fmt = (n?: number, maxFrac = 2) =>
    typeof n === "number" && isFinite(n)
      ? n.toLocaleString("en-US", { maximumFractionDigits: maxFrac })
      : "-";

  const handleBuy = () =>
    onBuy?.({ symbol, price: livePrice, sizeUSDT, riskPct, tpPrice, slPrice });

  const handleSell = () =>
    onSell?.({ symbol, price: livePrice, sizeUSDT, riskPct, tpPrice, slPrice });

  return (
    <div className="tcRoot">
      <div className="tcHead">
        <h3 className="tcTitle">Controles de Trade</h3>
        {/* o “Voltar ao início” fica fora, na página */}
      </div>

      {/* 
        Grid geral:
        2 colunas (esq/dir) para os campos principais
        + 3 faixas de base ocupando toda a largura:
          - tp/sl
          - buy/sell
          - reset/export
      */}
      <div className="tcGrid">
        {/* ====== COLUNA ESQUERDA ====== */}
        <div className="col">
          <label className="lbl">Par</label>
          <select
            className="inp"
            value={symbol}
            onChange={(e) => onSymbolChange?.(e.target.value as Pair)}
          >
            {PAIRS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <label className="lbl">Preço ao vivo</label>
          <input className="inp inp-disabled" disabled value={fmt(livePrice)} />

          <label className="lbl">Risco por trade (%)</label>
          <input
            className="inp"
            type="number"
            min={0}
            step={0.1}
            value={riskPct}
            onChange={(e) => setRiskPct(Number(e.target.value))}
          />

          <label className="lbl">Tamanho (USDT)</label>
          <input
            className="inp"
            type="number"
            min={0}
            step={100}
            value={sizeUSDT}
            onChange={(e) => setSizeUSDT(Number(e.target.value))}
          />
        </div>

        {/* ====== COLUNA DIREITA ====== */}
        <div className="col">
          <label className="lbl">PNL</label>
          <input className="inp inp-disabled" disabled value={fmt(pnl)} />

          <label className="lbl">Equity</label>
          <input className="inp inp-disabled" disabled value={fmt(equity)} />

          <label className="lbl">Saldo (USDT)</label>
          <input className="inp inp-disabled" disabled value={fmt(balance)} />

          <label className="lbl">Tamanho de posição</label>
          <input
            className="inp inp-disabled"
            disabled
            value={isFinite(positionSize) ? fmt(positionSize, 6) : "-"}
          />
        </div>

        {/* ====== FAIXA BASE 1: TP / SL ====== */}
        <div className="row twoCols">
          <div>
            <label className="lbl">TP (preço)</label>
            <input
              className="inp"
              type="number"
              step={0.01}
              value={tpPrice ?? ""}
              onChange={(e) =>
                setTpPrice(
                  e.target.value === "" ? undefined : Number(e.target.value)
                )
              }
              placeholder="TP (preço)"
            />
          </div>
          <div>
            <label className="lbl">SL (preço)</label>
            <input
              className="inp"
              type="number"
              step={0.01}
              value={slPrice ?? ""}
              onChange={(e) =>
                setSlPrice(
                  e.target.value === "" ? undefined : Number(e.target.value)
                )
              }
              placeholder="SL (preço)"
            />
          </div>
        </div>

        {/* ====== FAIXA BASE 2: Comprar / Vender ====== */}
        <div className="row twoCols">
          <button className="btn btnBuy" onClick={handleBuy}>
            Comprar
          </button>
          <button className="btn btnSell" onClick={handleSell}>
            Vender
          </button>
        </div>

        {/* ====== FAIXA BASE 3: Resetar / Exportar ====== */}
        <div className="row twoCols">
          <button className="btn" onClick={() => onResetHistory?.()}>
            Resetar histórico
          </button>
          <button className="btn" onClick={() => onExportCSV?.()}>
            Exportar CSV
          </button>
        </div>
      </div>

      <style jsx>{`
        .tcRoot {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 14px;
          display: grid;
          grid-auto-rows: min-content;
          gap: 10px;
        }
        .tcHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .tcTitle {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
        }

        /* Grid geral: 2 colunas + 3 linhas base ocupando toda a largura */
        .tcGrid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          grid-auto-rows: min-content;
          gap: 12px;
        }

        .col {
          display: grid;
          grid-auto-rows: min-content;
          gap: 8px;
          min-width: 0;
        }

        .row {
          grid-column: 1 / -1; /* ocupa as duas colunas */
        }

        .twoCols {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 10px;
        }

        /* inputs/botões – integram com seu tema (globals.css) */
        .lbl {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2px;
        }
        .inp {
          width: 100%;
          height: 36px;
          padding: 0 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          color: inherit;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .inp-disabled {
          background: rgba(255, 255, 255, 0.08);
          cursor: not-allowed;
        }
        .btn {
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          color: inherit;
          padding: 10px 12px;
          font-size: 15px;
        }
        .btn:hover {
          background: rgba(255, 255, 255, 0.12);
        }
        .btnBuy {
          background: linear-gradient(
            180deg,
            rgba(33, 243, 141, 0.22),
            rgba(33, 243, 141, 0.1)
          );
          border-color: rgba(33, 243, 141, 0.35);
          color: #1cff80;
          font-weight: 800;
        }
        .btnSell {
          background: linear-gradient(
            180deg,
            rgba(255, 76, 76, 0.2),
            rgba(255, 76, 76, 0.08)
          );
          color: #ff6b6b;
          border: 1px solid rgba(255, 255, 255, 0.35);
          font-weight: 800;
        }

        @media (max-width: 1100px) {
          .tcGrid {
            grid-template-columns: 1fr;
          }
          .row {
            grid-column: auto;
          }
        }
      `}</style>
    </div>
  );
}
