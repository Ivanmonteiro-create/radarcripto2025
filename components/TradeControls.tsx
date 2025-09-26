"use client";

import { useEffect, useMemo, useState } from "react";
import { getEngine } from "@/lib/tradeEngine";
import { exportTradesCSV } from "@/lib/csv";
import { priceFeed } from "@/lib/priceFeed";

type Pair =
  | "BTCUSDT" | "ETHUSDT" | "BNBUSDT" | "SOLUSDT"
  | "ADAUSDT" | "XRPUSDT" | "DOGEUSDT" | "LINKUSDT";

type Props = {
  symbol: Pair;
  onSymbolChange?: (s: Pair) => void;
  livePrice?: number;
};

const pairs: Pair[] = [
  "BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT",
  "ADAUSDT","XRPUSDT","DOGEUSDT","LINKUSDT",
];

const fmt2 = (n?: number) =>
  n === undefined ? "-" : n.toLocaleString("en-US", { maximumFractionDigits: 2 });

export default function TradeControls({ symbol, onSymbolChange, livePrice }: Props) {
  const engine = useMemo(() => getEngine(), []);
  const [mark, setMark] = useState<number | undefined>(livePrice);

  // parâmetros
  const [riskPct, setRiskPct] = useState(1);
  const [sizeUSDT, setSizeUSDT] = useState<number>(0);
  const [takeProfit, setTakeProfit] = useState<number | "">("");
  const [stopLoss, setStopLoss] = useState<number | "">("");

  // métricas extra
  const [spreadBps, setSpreadBps] = useState<number | undefined>();
  const [vol24h, setVol24h] = useState<number | undefined>();

  const [snap, setSnap] = useState(() => engine.snapshot(symbol, mark ?? 0));

  // feed de preço
  useEffect(() => {
    if (livePrice !== undefined) { setMark(livePrice); return; }
    const unsub = priceFeed.subscribe(symbol, (p) => setMark(p));
    return () => unsub?.();
  }, [symbol, livePrice]);

  // recalcula tamanho e snapshot
  useEffect(() => {
    const entry = mark ?? 0;
    const sl = typeof stopLoss === "number" ? stopLoss : entry * 0.99;
    const notional = engine.calcPositionSizeUSD(riskPct, entry, sl);
    setSizeUSDT(Number.isFinite(notional) ? Math.max(0, Math.floor(notional)) : 0);
    setSnap(engine.snapshot(symbol, entry));
  }, [mark, riskPct, stopLoss, symbol, engine]);

  // spread e vol 24h
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [vRes, sRes] = await Promise.all([
          fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`),
          fetch(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}`)
        ]);
        if (!vRes.ok || !sRes.ok) return;
        const v = await vRes.json();
        const b = await sRes.json();
        if (cancel) return;
        const vol = Number(v.quoteVolume);
        const bid = Number(b.bidPrice);
        const ask = Number(b.askPrice);
        const mid = (bid + ask) / 2;
        const sp = ((ask - bid) / mid) * 10_000; // bps
        setVol24h(vol);
        setSpreadBps(sp);
      } catch {}
    })();
    return () => { cancel = true; };
  }, [symbol]);

  // ações
  const buy = () => { if (!mark) return; engine.market(symbol, "BUY", sizeUSDT, mark); setSnap(engine.snapshot(symbol, mark)); };
  const sell = () => { if (!mark) return; const pos = engine.getPosition(symbol); if (pos && pos.qty > 0) engine.close(symbol, mark); setSnap(engine.snapshot(symbol, mark)); };
  const resetHist = () => { engine.reset(); setSnap(engine.snapshot(symbol, mark ?? 0)); };
  const exportCSV = () => exportTradesCSV(engine.getHistory());

  return (
    <section className="panel compactPanel compactRoot" style={{ padding: 12 }}>
      <div className="compactHeader" style={{ marginBottom: 8 }}>
        <h3 className="compactTitle">Controles de Trade</h3>
      </div>

      {/* === GRADE PRINCIPAL: 2 colunas iguais === */}
      <div
        className="compactGrid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",   // LADO A LADO EM PARTES IGUAIS
          gap: 10,
          alignItems: "start",
          width: "100%"
        }}
      >
        {/* ===== COLUNA ESQUERDA (parâmetros + ações) ===== */}
        <div className="colA" style={{ display: "grid", gap: 8 }}>
          <Card label="Par">
            <select
              className="inp"
              value={symbol}
              onChange={(e) => onSymbolChange?.(e.target.value as Pair)}
            >
              {pairs.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Card>

          <Card label="Preço ao vivo">
            <div className="fakeInput">{mark ? mark.toFixed(2) : "-"}</div>
          </Card>

          <Card label="Risco por trade (%)">
            <input
              className="inp"
              type="number"
              min={0}
              step={0.1}
              value={riskPct}
              onChange={(e) => setRiskPct(Number(e.target.value))}
            />
          </Card>

          <Card label="Tamanho (USDT)">
            <div className="fakeInput">{sizeUSDT ? `${fmt2(sizeUSDT)} USDT` : "-"}</div>
          </Card>

          <Card label="Take Profit (preço)">
            <input
              className="inp"
              placeholder="TP (preço)"
              type="number"
              value={takeProfit}
              onChange={(e) =>
                setTakeProfit(e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </Card>

          <Card label="Stop Loss (preço)">
            <input
              className="inp"
              placeholder="SL (preço)"
              type="number"
              value={stopLoss}
              onChange={(e) =>
                setStopLoss(e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </Card>

          {/* AÇÕES */}
          <div className="twoCols" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <button className="btn btnBuy" onClick={buy}>Comprar</button>
            <button className="btn btnSell" onClick={sell}>Vender</button>
          </div>

          <div className="twoCols" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <button className="btn" onClick={resetHist}>Resetar histórico</button>
            <button className="btn" onClick={exportCSV}>Exportar CSV</button>
          </div>
        </div>

        {/* ===== COLUNA DIREITA (métricas) ===== */}
        <div className="colB" style={{ display: "grid", gap: 8 }}>
          <Metric label="PNL" value={fmt2(snap.pnl)} />
          <Metric label="Equity" value={fmt2(snap.equity)} />
          <Metric label="Saldo (USDT)" value={fmt2(snap.balance)} />
          <Metric label="Tamanho de posição" value={snap.position ? fmt2(snap.position.qty) : "-"} />
          <Metric label="Preço médio da posição" value={snap.position?.avgPrice ? fmt2(snap.position.avgPrice) : "-"} />
          <Metric label="Spread (bps)" value={spreadBps !== undefined ? spreadBps.toFixed(1) : "-"} />
          <Metric label="Volume 24h (USDT)" value={vol24h ? fmt2(vol24h) : "-"} />
          <Metric label="TP/SL" value={(takeProfit || stopLoss) ? `${takeProfit || "-"} / ${stopLoss || "-"}` : "-"} />
        </div>
      </div>
    </section>
  );
}

/* === Componentes de UI mínimos (cards) === */
function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="cardMini" style={{ display: "grid", gap: 6 }}>
      <span className="lbl">{label}</span>
      {children}
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="cardMini" style={{ display: "grid", gap: 6 }}>
      <span className="lbl">{label}</span>
      <div className="fakeInput" style={{ height: 36 }}>{value}</div>
    </div>
  );
}
