"use client";

import React, { useEffect, useMemo, useState } from "react";

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

/** Registro simples para o histórico */
export type TradeSide = "BUY" | "SELL";
export type TradeRecord = {
  ts: number; // epoch ms
  side: TradeSide;
  symbol: Pair;
  price: number;
  sizeUSDT: number;
  pnl?: number; // PnL realizado nesse trade (se houver)
};

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

  /** Preço ao vivo vindo do SimPageClient */
  livePrice?: number;

  /** Os props abaixo continuam aceitos, mas agora calculamos localmente por padrão */
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

  /** Histórico a ser exibido (opcional). Se não vier, usamos o interno. */
  history?: TradeRecord[];
};

export default function TradeControls({
  symbol,
  onSymbolChange,
  livePrice,
  pnl: pnlProp,
  equity: equityProp,
  balance: balanceProp,
  onBuy,
  onSell,
  onResetHistory,
  onExportCSV,
  history: historyProp,
}: Props) {
  /** ===== Estados de entrada do usuário ===== */
  const [riskPct, setRiskPct] = useState<number>(1);
  const [sizeUSDT, setSizeUSDT] = useState<number>(100_000);
  const [tpPrice, setTpPrice] = useState<number | undefined>();
  const [slPrice, setSlPrice] = useState<number | undefined>();

  /** ===== Estados internos do simulador (sem mexer na página) ===== */
  const [cash, setCash] = useState<number>(100_000); // Saldo (USDT)
  const [positionQty, setPositionQty] = useState<number>(0); // quantidade (pode ser negativa = short)
  const [avgEntry, setAvgEntry] = useState<number | null>(null); // preço médio (null se sem posição)
  const [history, setHistory] = useState<TradeRecord[]>([]);

  /** Zera posição e estados quando troca de par (mantendo o saldo) */
  useEffect(() => {
    setPositionQty(0);
    setAvgEntry(null);
    setTpPrice(undefined);
    setSlPrice(undefined);
    setHistory([]);
  }, [symbol]);

  /** Tamanho de posição em “moeda base” calculado pelo tamanho em USDT */
  const qtyFromUSDT = (price?: number) => {
    const px = price && price > 0 ? price : undefined;
    if (!px) return 0;
    return sizeUSDT / px;
  };

  /** Tamanho de posição exibido (derivado do sizeUSDT atual) */
  const positionSizePreview = useMemo(() => {
    const px = livePrice && livePrice > 0 ? livePrice : 1;
    return sizeUSDT / px;
  }, [sizeUSDT, livePrice]);

  /** PnL não realizado (mark-to-market) */
  const unrealizedPnL = useMemo(() => {
    if (!livePrice || !isFinite(livePrice) || positionQty === 0 || !avgEntry)
      return 0;
    // (live - avg) * qty — funciona para long/short
    return (livePrice - avgEntry) * positionQty;
  }, [livePrice, avgEntry, positionQty]);

  /** Equity e saldo visíveis (se props não vierem, usamos internos) */
  const balanceShown =
    typeof balanceProp === "number" ? balanceProp : cash;
  const pnlShown = typeof pnlProp === "number" ? pnlProp : unrealizedPnL;
  const equityShown =
    typeof equityProp === "number"
      ? equityProp
      : balanceShown + pnlShown;

  /** Utilitário de formatação */
  const fmt = (n?: number, maxFrac = 2) =>
    typeof n === "number" && isFinite(n)
      ? n.toLocaleString("en-US", { maximumFractionDigits: maxFrac })
      : "-";

  /** ===== Execução de trade (spot com possibilidade de short) ===== */
  const execute = (side: TradeSide, price?: number) => {
    const px = price && price > 0 ? price : undefined;
    if (!px) return; // sem preço válido, não opera

    const tradeQtyAbs = qtyFromUSDT(px); // quantidade a negociar (sempre positiva)
    if (tradeQtyAbs <= 0) return;

    const isBuy = side === "BUY";
    const signedQty = isBuy ? tradeQtyAbs : -tradeQtyAbs;

    const newQty = positionQty + signedQty;
    let realized = 0;

    // Se o trade reduz ou inverte a posição, calcular PnL realizado para a parte fechada
    if (positionQty !== 0 && avgEntry != null && Math.sign(positionQty) !== Math.sign(newQty)) {
      // Inverteu (atravessou zero)
      realized += (px - avgEntry) * positionQty;
    } else if (
      positionQty !== 0 &&
      avgEntry != null &&
      Math.sign(positionQty) !== Math.sign(signedQty)
    ) {
      // Redução parcial sem inverter
      const closeQty = Math.min(Math.abs(positionQty), Math.abs(signedQty));
      realized += (px - avgEntry) * (closeQty * Math.sign(positionQty));
    }

    // Atualiza caixa: buy gasta, sell recebe
    setCash((c) => c + signedQty * -px);

    // Atualiza posição e preço médio
    if (newQty === 0) {
      setPositionQty(0);
      setAvgEntry(null);
    } else {
      if (Math.sign(newQty) === Math.sign(positionQty) || positionQty === 0) {
        const prevNotional = (avgEntry ?? px) * Math.abs(positionQty);
        const addNotional = px * Math.abs(signedQty);
        const totalNotional = prevNotional + addNotional;
        const totalQtyAbs = Math.abs(positionQty) + Math.abs(signedQty);
        const newAvg = totalNotional / totalQtyAbs;
        setAvgEntry(newAvg);
      } else {
        setAvgEntry(px);
      }
      setPositionQty(newQty);
    }

    // Histórico
    setHistory((h) => [
      ...h,
      {
        ts: Date.now(),
        side,
        symbol,
        price: px,
        sizeUSDT: sizeUSDT,
        pnl: realized !== 0 ? realized : undefined,
      },
    ]);
  };

  /** Handlers dos botões (respeitam callbacks externos se existirem) */
  const handleBuy = () => {
    if (onBuy) {
      onBuy({ symbol, price: livePrice, sizeUSDT, riskPct, tpPrice, slPrice });
    } else {
      execute("BUY", livePrice);
    }
  };

  const handleSell = () => {
    if (onSell) {
      onSell({ symbol, price: livePrice, sizeUSDT, riskPct, tpPrice, slPrice });
    } else {
      execute("SELL", livePrice);
    }
  };

  /** TP/SL automáticos: fecha a posição quando tocar */
  useEffect(() => {
    if (!livePrice || !isFinite(livePrice) || positionQty === 0) return;

    // Long
    if (positionQty > 0) {
      if (tpPrice && livePrice >= tpPrice) {
        const allUSDT = Math.abs(positionQty) * livePrice;
        const prevSize = sizeUSDT;
        setSizeUSDT(allUSDT);
        execute("SELL", livePrice);
        setSizeUSDT(prevSize);
        setTpPrice(undefined);
      } else if (slPrice && livePrice <= slPrice) {
        const allUSDT = Math.abs(positionQty) * livePrice;
        const prevSize = sizeUSDT;
        setSizeUSDT(allUSDT);
        execute("SELL", livePrice);
        setSizeUSDT(prevSize);
        setSlPrice(undefined);
      }
    }

    // Short
    if (positionQty < 0) {
      if (tpPrice && livePrice <= tpPrice) {
        const allUSDT = Math.abs(positionQty) * livePrice;
        const prevSize = sizeUSDT;
        setSizeUSDT(allUSDT);
        execute("BUY", livePrice);
        setSizeUSDT(prevSize);
        setTpPrice(undefined);
      } else if (slPrice && livePrice >= slPrice) {
        const allUSDT = Math.abs(positionQty) * livePrice;
        const prevSize = sizeUSDT;
        setSizeUSDT(allUSDT);
        execute("BUY", livePrice);
        setSizeUSDT(prevSize);
        setSlPrice(undefined);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePrice]);

  /** Resetar histórico e estados de posição (mantém saldo inicial) */
  const handleResetHistory = () => {
    if (onResetHistory) return onResetHistory();
    setHistory([]);
    setPositionQty(0);
    setAvgEntry(null);
    setTpPrice(undefined);
    setSlPrice(undefined);
  };

  /** Exportar CSV do histórico interno */
  const handleExportCSV = () => {
    if (onExportCSV) return onExportCSV();

    const rows = [
      ["timestamp", "date", "side", "symbol", "price", "sizeUSDT", "pnl"],
      ...history.map((r) => [
        String(r.ts),
        new Date(r.ts).toISOString(),
        r.side,
        r.symbol,
        String(r.price),
        String(r.sizeUSDT),
        typeof r.pnl === "number" ? String(r.pnl) : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace?.(/"/g, '""') ?? c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `history_${symbol}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Histórico exibido: prop tem prioridade; se não vier, usa interno
  const historyShown = historyProp ?? history;

  /** ===== Classes de cor do PnL (verde/positivo, vermelho/negativo) ===== */
  const pnlClass = pnlShown > 0 ? "pnlPos" : pnlShown < 0 ? "pnlNeg" : "pnlZero";

  return (
    <div className="tcRoot">
      <div className="tcHead">
        <h3 className="tcTitle">Controles de Trade</h3>
        {/* “Voltar ao início” fica na página; aqui só o painel */}
      </div>

      {/* 2 colunas + três faixas base + histórico ocupando largura total */}
      <div className="tcGrid">
        {/* ===== COLUNA ESQUERDA ===== */}
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

        {/* ===== COLUNA DIREITA ===== */}
        <div className="col">
          <label className="lbl">PNL</label>
          <input
            className={`inp inp-disabled ${pnlClass}`}
            disabled
            value={fmt(pnlShown)}
          />

          <label className="lbl">Equity</label>
          <input className="inp inp-disabled" disabled value={fmt(equityShown)} />

          <label className="lbl">Saldo (USDT)</label>
          <input className="inp inp-disabled" disabled value={fmt(balanceShown)} />

          <label className="lbl">Tamanho de posição</label>
          <input
            className="inp inp-disabled"
            disabled
            value={isFinite(positionSizePreview) ? fmt(positionSizePreview, 6) : "-"}
          />
        </div>

        {/* ===== FAIXA 1: TP / SL ===== */}
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

        {/* ===== FAIXA 2: Comprar / Vender ===== */}
        <div className="row twoCols">
          <button className="btn btnBuy" onClick={handleBuy} disabled={!livePrice}>
            Comprar
          </button>
          <button className="btn btnSell" onClick={handleSell} disabled={!livePrice}>
            Vender
          </button>
        </div>

        {/* ===== FAIXA 3: Resetar / Exportar ===== */}
        <div className="row twoCols">
          <button className="btn" onClick={handleResetHistory}>
            Resetar histórico
          </button>
          <button className="btn" onClick={handleExportCSV}>
            Exportar CSV
          </button>
        </div>

        {/* ===== RODAPÉ: HISTÓRICO ===== */}
        <div className="row histCard">
          <div className="histHead">
            <span className="histTitle">Histórico</span>
            <span className="muted xs">
              {historyShown.length
                ? `${historyShown.length} operações`
                : "Sem operações ainda."}
            </span>
          </div>

          {historyShown.length > 0 && (
            <div className="histTable">
              <div className="histRow histRow--head">
                <span>Data</span>
                <span>Side</span>
                <span>Par</span>
                <span>Preço</span>
                <span>Tam. (USDT)</span>
                <span>PNL</span>
              </div>

              {historyShown.slice(-15).reverse().map((h) => {
                const pnlSign =
                  typeof h.pnl === "number" ? (h.pnl > 0 ? "pnlPos" : h.pnl < 0 ? "pnlNeg" : "pnlZero") : "";
                return (
                  <div key={h.ts + "-" + h.side} className="histRow">
                    <span>{new Date(h.ts).toLocaleString()}</span>
                    <span className={h.side === "BUY" ? "green" : "red"}>{h.side}</span>
                    <span>{h.symbol}</span>
                    <span>{fmt(h.price, 4)}</span>
                    <span>{fmt(h.sizeUSDT, 0)}</span>
                    <span className={pnlSign}>
                      {typeof h.pnl === "number" ? fmt(h.pnl, 2) : "-"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
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
          height: 100%;
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

        /* Histórico */
        .histCard {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          padding: 10px;
        }
        .histHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .histTitle {
          font-weight: 800;
        }
        .histTable {
          display: grid;
          gap: 6px;
        }
        .histRow {
          display: grid;
          grid-template-columns: 1.6fr 0.6fr 0.9fr 1fr 1fr 0.8fr;
          gap: 6px;
          font-size: 13px;
          align-items: center;
        }
        .histRow--head {
          opacity: 0.7;
          font-weight: 700;
        }

        /* Tema inputs / botões (coeso com seu globals.css) */
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

        .green { color: #1cff80; font-weight: 800 }
        .red   { color: #ff6b6b; font-weight: 800 }

        /* ===== Cores de PNL ===== */
        .pnlPos  { color: #1cff80 !important; font-weight: 800; }
        .pnlNeg  { color: #ff6b6b !important; font-weight: 800; }
        .pnlZero { color: #e6e6e6 !important; }

        @media (max-width: 1100px) {
          .tcGrid { grid-template-columns: 1fr; }
          .row { grid-column: auto; }
          .histRow {
            grid-template-columns: 1.4fr .6fr .8fr .8fr .8fr .7fr;
          }
        }
      `}</style>
    </div>
  );
}
