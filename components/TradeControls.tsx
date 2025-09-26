"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

/** ==== Pares (8) – com LINKUSDT no lugar da DOT ==== */
export type Pair =
  | "BTCUSDT"
  | "ETHUSDT"
  | "BNBUSDT"
  | "SOLUSDT"
  | "ADAUSDT"
  | "XRPUSDT"
  | "LTCUSDT"
  | "LINKUSDT";

const PAIRS: Pair[] = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "ADAUSDT",
  "XRPUSDT",
  "LTCUSDT",
  "LINKUSDT",
];

type Props = {
  symbol: Pair;
  onSymbolChange: (s: Pair) => void;
  /** preço atual vindo do priceFeed/tradingview (opcional) */
  livePrice?: number;
};

/** Utilitário simples para moeda */
function fmt(n: number | undefined) {
  if (n === undefined || Number.isNaN(n)) return "-";
  try {
    return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  } catch {
    return String(n);
  }
}

export default function TradeControls({ symbol, onSymbolChange, livePrice }: Props) {
  // ======= estados de “trade” (mínimos p/ UI) =======
  const [riskPct, setRiskPct] = useState<number>(1); // % por trade
  const [tp, setTp] = useState<number | "">("");
  const [sl, setSl] = useState<number | "">("");
  const [pnl, setPnl] = useState<number>(0);
  const [equity, setEquity] = useState<number>(100_000);
  const [positionQty, setPositionQty] = useState<number>(0);      // tamanho de posição (em moeda)
  const [avgPrice, setAvgPrice] = useState<number | undefined>(); // preço médio
  const [spreadBps] = useState<number>(0.0);                      // placeholder

  /** resumo TP/SL textual (opcional) */
  const tpSlSummary = useMemo(() => {
    const t = tp === "" ? "-" : tp;
    const s = sl === "" ? "-" : sl;
    return `${t} / ${s}`;
  }, [tp, sl]);

  /** handlers */
  function handleBuy() {
    if (!livePrice) return;
    // lógica mínima de simulação: compra 0.001 * equity (apenas para não quebrar a UI)
    const qty = Math.max(0.000001, (equity * 0.001) / livePrice);
    const newQty = positionQty + qty;
    const newAvg =
      newQty > 0
        ? ((avgPrice ?? livePrice) * positionQty + livePrice * qty) / newQty
        : livePrice;

    setPositionQty(newQty);
    setAvgPrice(newAvg);
  }

  function handleSell() {
    if (!livePrice) return;
    if (positionQty <= 0) return;
    // zera toda a posição (simples)
    const realized = (livePrice - (avgPrice ?? livePrice)) * positionQty;
    setPnl((p) => p + realized);
    setEquity((e) => e + realized);
    setPositionQty(0);
    setAvgPrice(undefined);
  }

  function handleResetHistory() {
    setPnl(0);
    setPositionQty(0);
    setAvgPrice(undefined);
    setEquity(100_000);
    setTp("");
    setSl("");
  }

  /** Exporta CSV básico de operações (mock simples apenas com snapshot) */
  function handleExportCSV() {
    const rows = [
      ["symbol", "price_now", "pnl", "equity", "position_qty", "avg_price", "tp", "sl", "risk_pct"],
      [
        symbol,
        livePrice ?? "",
        pnl,
        equity,
        positionQty,
        avgPrice ?? "",
        tp === "" ? "" : tp,
        sl === "" ? "" : sl,
        riskPct,
      ],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `radarcrypto_${symbol}_snapshot.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <aside className="panel compactPanel tradePanelShell" style={{ minWidth: 340 }}>
      {/* ===== Cabeçalho ===== */}
      <div className="tcHeader">
        <h3 className="tcTitle">Controles de Trade</h3>
        <div className="tcHeaderActions">
          <Link href="/" className="btn btn-xs btn-primary tcBackBtn">Voltar ao início</Link>
        </div>
      </div>

      {/* ====== Grade de duas colunas (sem sobras) ====== */}
      <div
        className="tcGrid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          alignItems: "start",
        }}
      >
        {/* ---- Coluna ESQUERDA ---- */}
        <div className="col">
          {/* Par */}
          <label className="lbl">Par</label>
          <div className="fakeInput" style={{ padding: 0 }}>
            <select
              value={symbol}
              onChange={(e) => onSymbolChange(e.target.value as Pair)}
              className="inp"
              style={{ width: "100%" }}
            >
              {PAIRS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Preço ao vivo */}
          <label className="lbl" style={{ marginTop: 8 }}>Preço ao vivo</label>
          <input className="inp" readOnly value={fmt(livePrice)} />

          {/* Risco por trade (%) */}
          <label className="lbl" style={{ marginTop: 8 }}>Risco por trade (%)</label>
          <input
            className="inp"
            type="number"
            step="0.1"
            value={riskPct}
            onChange={(e) => setRiskPct(Number(e.target.value))}
            min={0}
          />

          {/* Take Profit (preço) */}
          <label className="lbl" style={{ marginTop: 8 }}>Take Profit (preço)</label>
          <input
            className="inp"
            type="number"
            value={tp}
            onChange={(e) => {
              const v = e.target.value;
              setTp(v === "" ? "" : Number(v));
            }}
          />

          {/* Stop Loss (preço) */}
          <label className="lbl" style={{ marginTop: 8 }}>Stop Loss (preço)</label>
          <input
            className="inp"
            type="number"
            value={sl}
            onChange={(e) => {
              const v = e.target.value;
              setSl(v === "" ? "" : Number(v));
            }}
          />

          {/* Ações */}
          <div className="twoCols" style={{ marginTop: 10 }}>
            <button onClick={handleBuy} className="btn btnBuy btn-xs">Comprar</button>
            <button onClick={handleSell} className="btn btnSell btn-xs">Vender</button>
          </div>

          <div className="twoCols" style={{ marginTop: 8 }}>
            <button onClick={handleResetHistory} className="btn btn-xs">Resetar histórico</button>
            <button onClick={handleExportCSV} className="btn btn-xs">Exportar CSV</button>
          </div>
        </div>

        {/* ---- Coluna DIREITA ---- */}
        <div className="col">
          {/* PNL */}
          <label className="lbl">PNL</label>
          <input className="inp" readOnly value={fmt(pnl)} />

          {/* Equity */}
          <label className="lbl" style={{ marginTop: 8 }}>Equity</label>
          <input className="inp" readOnly value={fmt(equity)} />

          {/* Tamanho de posição (em moeda) */}
          <label className="lbl" style={{ marginTop: 8 }}>Tamanho de posição</label>
          <input className="inp" readOnly value={fmt(positionQty)} />

          {/* Preço médio da posição */}
          <label className="lbl" style={{ marginTop: 8 }}>Preço médio da posição</label>
          <input className="inp" readOnly value={fmt(avgPrice)} />

          {/* Spread (bps) */}
          <label className="lbl" style={{ marginTop: 8 }}>Spread (bps)</label>
          <input className="inp" readOnly value={fmt(spreadBps)} />

          {/* TP/SL resumo (opcional – pode remover se quiser) */}
          <label className="lbl" style={{ marginTop: 8 }}>TP/SL</label>
          <input className="inp" readOnly value={tpSlSummary} />
        </div>
      </div>
    </aside>
  );
}
