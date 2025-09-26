"use client";

import { useEffect, useMemo, useState } from "react";
import { getEngine } from "@/lib/tradeEngine";
import { exportTradesCSV } from "@/lib/csv";
import { priceFeed } from "@/lib/priceFeed"; // ✅ corrigido: export nomeado

type Pair =
  | "BTCUSDT" | "ETHUSDT" | "BNBUSDT" | "SOLUSDT"
  | "ADAUSDT" | "XRPUSDT" | "DOGEUSDT" | "LINKUSDT";

type Props = {
  symbol: Pair;
  onSymbolChange?: (s: Pair) => void;
  livePrice?: number;
};

const fmt2 = (n: number | undefined) =>
  (n === undefined ? "-" : n.toLocaleString("en-US", { maximumFractionDigits: 2 }));

export default function TradeControls({ symbol, onSymbolChange, livePrice }: Props) {
  const engine = useMemo(() => getEngine(), []);
  const [mark, setMark] = useState<number | undefined>(livePrice);
  const [riskPct, setRiskPct] = useState(1);
  const [takeProfit, setTakeProfit] = useState<number | "">("");
  const [stopLoss, setStopLoss] = useState<number | "">("");
  const [sizeUSDT, setSizeUSDT] = useState<number>(0);
  const [spreadBps, setSpreadBps] = useState<number | undefined>();
  const [vol24h, setVol24h] = useState<number | undefined>();
  const [snap, setSnap] = useState(() => engine.snapshot(symbol, mark ?? 0));

  // Assina preço se não veio por prop
  useEffect(() => {
    if (livePrice !== undefined) { setMark(livePrice); return; }
    const unsub = priceFeed.subscribe(symbol, (p) => setMark(p));
    return () => unsub?.();
  }, [symbol, livePrice]);

  // Atualiza métricas derivadas
  useEffect(() => {
    const entry = mark ?? 0;
    const stop = typeof stopLoss === "number" ? stopLoss : entry * 0.99;
    const notional = engine.calcPositionSizeUSD(riskPct, entry, stop);
    setSizeUSDT(Number.isFinite(notional) ? Math.max(0, Math.floor(notional)) : 0);
    setSnap(engine.snapshot(symbol, entry));
  }, [mark, riskPct, stopLoss, symbol, engine]);

  // Volume 24h + Spread da Binance
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [vRes, sRes] = await Promise.all([
          fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`),
          fetch(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}`),
        ]);
        if (!vRes.ok || !sRes.ok) return;
        const v = await vRes.json();
        const b = await sRes.json();
        if (cancel) return;
        const vol = Number(v.quoteVolume);
        const bid = Number(b.bidPrice);
        const ask = Number(b.askPrice);
        const mid = (bid + ask) / 2;
        const sp = ((ask - bid) / mid) * 10_000;
        setVol24h(vol);
        setSpreadBps(sp);
      } catch {}
    })();
    return () => { cancel = true; };
  }, [symbol]);

  // Ações
  const buy = () => {
    if (!mark) return;
    engine.market(symbol, "BUY", sizeUSDT, mark);
    setSnap(engine.snapshot(symbol, mark));
  };
  const sell = () => {
    if (!mark) return;
    const pos = engine.getPosition(symbol);
    if (pos && pos.qty > 0) {
      engine.close(symbol, mark);
    } else {
      return;
    }
    setSnap(engine.snapshot(symbol, mark));
  };
  const resetHist = () => {
    engine.reset();
    setSnap(engine.snapshot(symbol, mark ?? 0));
  };
  const exportCSV = () => exportTradesCSV(engine.getHistory());

  return (
    <div className="compactPanel compactRoot">
      <div className="compactHeader">
        <h3 className="compactTitle">Controles de Trade</h3>
        <button className="btn btn-xs tcBackBtn" onClick={() => (window.location.href = "/")}>
          Voltar ao início
        </button>
      </div>

      <div className="compactGrid">
        {/* Coluna A */}
        <div className="colA">
          <div className="cardMini">
            <label className="lbl">Par</label>
            <div className="twoCols">
              <select
                value={symbol}
                onChange={(e) => onSymbolChange?.(e.target.value as Pair)}
                className="inp"
              >
                {pairs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="fakeInput">{mark ? mark.toFixed(2) : "-"}</div>
            </div>
          </div>

          <div className="cardMini">
            <label className="lbl">Risco por trade (%)</label>
            <div className="twoCols">
              <input
                className="inp"
                type="number"
                step="0.1"
                min={0}
                value={riskPct}
                onChange={(e) => setRiskPct(Number(e.target.value))}
              />
              <div className="fakeInput">{sizeUSDT ? `${fmt2(sizeUSDT)} USDT` : "-"}</div>
            </div>
          </div>

          <div className="cardMini">
            <label className="lbl">Take Profit / Stop Loss</label>
            <div className="twoCols">
              <input
                className="inp"
                placeholder="TP (preço)"
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value === "" ? "" : Number(e.target.value))}
              />
              <input
                className="inp"
                placeholder="SL (preço)"
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>

          <div className="twoCols">
            <button className="btn btnBuy" onClick={buy}>Comprar</button>
            <button className="btn btnSell" onClick={sell}>Vender</button>
          </div>

          <div className="twoCols">
            <button className="btn" onClick={resetHist}>Resetar histórico</button>
            <button className="btn" onClick={exportCSV}>Exportar CSV</button>
          </div>
        </div>

        {/* Coluna B */}
        <div className="colB">
          <div className="threeCols">
            <Metric label="PNL" value={fmt2(snap.pnl)} />
            <Metric label="Equity" value={fmt2(snap.equity)} />
            <Metric label="Saldo (USDT)" value={fmt2(snap.balance)} />
          </div>

          <div className="threeCols" style={{ marginTop: 8 }}>
            <Metric label="Tamanho de posição" value={snap.position ? fmt2(snap.position.qty) : "-"} />
            <Metric label="Preço médio" value={snap.position?.avgPrice ? fmt2(snap.position.avgPrice) : "-"} />
            <Metric label="Spread (bps)" value={spreadBps !== undefined ? spreadBps.toFixed(1) : "-"} />
          </div>

          <div className="threeCols" style={{ marginTop: 8 }}>
            <Metric label="Variação 24h" value={vol24h ? "—" : "-"} />
            <Metric label="Volume 24h (USDT)" value={vol24h ? fmt2(vol24h) : "-"} />
            <Metric label="TP/SL" value={
              (takeProfit || stopLoss) ? `${takeProfit || "-"} / ${stopLoss || "-"}`
              : "-"
            } />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="cardMini">
      <span className="lbl">{label}</span>
      <div className="fakeInput" style={{ height: 36 }}>{value}</div>
    </div>
  );
}

const pairs: Pair[] = [
  "BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT",
  "ADAUSDT","XRPUSDT","DOGEUSDT","LINKUSDT",
];
