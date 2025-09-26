"use client";

import React, { useMemo, useState } from "react";

/** ==== Pares (8) – com LINKUSDT (no lugar da DOT) e DOGEUSDT incluso ==== */
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

/** ==== Tipagem de props – flexível para não quebrar o build ==== */
type Props = {
  /** Par atual (vem da página) */
  symbol: Pair;

  /** Troca de par (devolve um Pair; se sua página aceitar string, faça o cast lá) */
  onSymbolChange?: (s: Pair) => void;

  /** Preço ao vivo (se não vier, mostramos “–”) */
  livePrice?: number;

  /** Leituras do simulador (se existirem) */
  pnl?: number;
  equity?: number;
  balance?: number;

  /** Ações (opcionais) */
  onBuy?: (params: {
    symbol: Pair;
    price?: number;
    sizeUSDT: number;
    riskPct: number;
    tpPrice?: number;
    slPrice?: number;
  }) => void;

  onSell?: (params: {
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
  /* ======= estados locais: risco, tamanho, tp/sl ======= */
  const [riskPct, setRiskPct] = useState<number>(1);
  const [sizeUSDT, setSizeUSDT] = useState<number>(100_000);
  const [tpPrice, setTpPrice] = useState<number | undefined>();
  const [slPrice, setSlPrice] = useState<number | undefined>();

  /* ======= derivado simples para “tamanho de posição” ======= */
  const positionSize = useMemo(() => {
    // regra simples de exemplo: posição = sizeUSDT / (livePrice ou 1 para evitar NaN)
    const px = livePrice && livePrice > 0 ? livePrice : 1;
    return sizeUSDT / px;
  }, [sizeUSDT, livePrice]);

  const pretty = (n?: number) =>
    typeof n === "number" && isFinite(n) ? n.toLocaleString("en-US") : "-";

  /* ======= ações ======= */
  const handleBuy = () => {
    onBuy?.({
      symbol,
      price: livePrice,
      sizeUSDT,
      riskPct,
      tpPrice,
      slPrice,
    });
  };
  const handleSell = () => {
    onSell?.({
      symbol,
      price: livePrice,
      sizeUSDT,
      riskPct,
      tpPrice,
      slPrice,
    });
  };

  /* ======= UI ======= */
  return (
    <div className="tcRoot compactPanel compactRoot">
      <div className="tcHeader">
        <h3 className="tcTitle">Controles de Trade</h3>
        {/* O botão “Voltar ao início” fica fora deste componente na página */}
      </div>

      <div className="tcForm twoCols">
        {/* ==== COLUNA ESQUERDA ==== */}
        <div className="col">
          {/* Par */}
          <label className="lbl">Par</label>
          <div className="field">
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
          </div>

          {/* Preço ao vivo */}
          <label className="lbl">Preço ao vivo</label>
          <input
            className="inp inp-disabled"
            disabled
            value={pretty(livePrice)}
            readOnly
          />

          {/* Risco por trade (%) */}
          <label className="lbl">Risco por trade (%)</label>
          <input
            className="inp"
            type="number"
            min={0}
            step={0.1}
            value={riskPct}
            onChange={(e) => setRiskPct(Number(e.target.value))}
          />

          {/* Tamanho (USDT) */}
          <label className="lbl">Tamanho (USDT)</label>
          <input
            className="inp"
            type="number"
            min={0}
            step={100}
            value={sizeUSDT}
            onChange={(e) => setSizeUSDT(Number(e.target.value))}
          />

          {/* Botões principais */}
          <div className="twoCols" style={{ marginTop: 8 }}>
            <button className="btn btnBuy" onClick={handleBuy}>
              Comprar
            </button>
            <button className="btn btnSell" onClick={handleSell}>
              Vender
            </button>
          </div>

          {/* Ações secundárias */}
          <div className="twoCols" style={{ marginTop: 8 }}>
            <button className="btn" onClick={() => onResetHistory?.()}>
              Resetar histórico
            </button>
            <button className="btn" onClick={() => onExportCSV?.()}>
              Exportar CSV
            </button>
          </div>
        </div>

        {/* ==== COLUNA DIREITA ==== */}
        <div className="col">
          {/* PNL */}
          <label className="lbl">PNL</label>
          <input className="inp inp-disabled" disabled value={pretty(pnl)} />

          {/* Equity */}
          <label className="lbl">Equity</label>
          <input
            className="inp inp-disabled"
            disabled
            value={pretty(equity)}
          />

          {/* Saldo (USDT) */}
          <label className="lbl">Saldo (USDT)</label>
          <input
            className="inp inp-disabled"
            disabled
            value={pretty(balance)}
          />

          {/* Tamanho de posição (read-only, derivado) */}
          <label className="lbl">Tamanho de posição</label>
          <input
            className="inp inp-disabled"
            disabled
            value={
              isFinite(positionSize)
                ? positionSize.toLocaleString("en-US", {
                    maximumFractionDigits: 6,
                  })
                : "-"
            }
          />

          {/* TP / SL (preço) */}
          <div className="twoCols" style={{ marginTop: 8 }}>
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
        </div>
      </div>

      <style jsx>{`
        .tcRoot {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 14px;
        }
        .tcForm {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .col {
          display: grid;
          grid-auto-rows: min-content;
          gap: 8px;
        }
        @media (max-width: 1100px) {
          .tcForm {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
