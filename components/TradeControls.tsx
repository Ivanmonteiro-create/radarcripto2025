"use client";

import { useEffect, useState } from "react";
import { SimulationEngine } from "@/lib/trading/simulationEngine";
import { useI18n } from "@/components/i18n/LocaleProvider";

export type Pair = "BTCUSDT" | "ETHUSDT" | "BNBUSDT" | "SOLUSDT" | "ADAUSDT" | "XRPUSDT" | "DOGEUSDT" | "LINKUSDT";
export type TradeSide = "BUY" | "SELL";
export type TradeRecord = { ts: number; side: TradeSide; symbol: Pair; price: number; sizeUSDT: number; pnl?: number };

const PAIRS: Pair[] = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT", "XRPUSDT", "DOGEUSDT", "LINKUSDT"];

type Props = {
  symbol: Pair;
  onSymbolChange?: (symbol: Pair) => void;
  livePrice?: number;
  onBuy?: (payload: { symbol: Pair; price?: number; sizeUSDT: number; riskPct: number; tpPrice?: number; slPrice?: number }) => void;
  onSell?: (payload: { symbol: Pair; price?: number; sizeUSDT: number; riskPct: number; tpPrice?: number; slPrice?: number }) => void;
};

export default function TradeControls({ symbol, onSymbolChange, livePrice, onBuy, onSell }: Props) {
  const { locale, t } = useI18n();
  const label = (pt: string, en: string, es: string) => locale === "en" ? en : locale === "es" ? es : pt;
  const [engine] = useState(() => new SimulationEngine({ initialCashUSDT: 10_000, feeRate: 0.001, slippageBps: 1 }));
  const [snapshot, setSnapshot] = useState(() => engine.snapshot());
  const [riskPct, setRiskPct] = useState(10);
  const [sizeUSDT, setSizeUSDT] = useState(1_000);
  const [tpPrice, setTpPrice] = useState<number>();
  const [slPrice, setSlPrice] = useState<number>();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!livePrice) return;
    engine.setMarketPrice(symbol, livePrice);
    const closed = engine.evaluateExit(symbol, livePrice, { takeProfitPrice: tpPrice, stopLossPrice: slPrice });
    const nextSnapshot = engine.snapshot();
    queueMicrotask(() => {
      if (closed) { setTpPrice(undefined); setSlPrice(undefined); }
      setSnapshot(nextSnapshot);
    });
  }, [engine, livePrice, slPrice, symbol, tpPrice]);

  const position = snapshot.positions.find((item) => item.symbol === symbol);
  const riskLimit = snapshot.equity * (riskPct / 100);
  const executableUSDT = Math.min(sizeUSDT, riskLimit);

  function execute(side: TradeSide) {
    if (!livePrice) return;
    setError("");
    if (side === "BUY" && onBuy) return onBuy({ symbol, price: livePrice, sizeUSDT: executableUSDT, riskPct, tpPrice, slPrice });
    if (side === "SELL" && onSell) return onSell({ symbol, price: livePrice, sizeUSDT: executableUSDT, riskPct, tpPrice, slPrice });
    try {
      engine.createMarketOrder({
        symbol, side, marketPrice: livePrice,
        notionalUSDT: side === "BUY" ? executableUSDT : undefined,
        quantity: side === "SELL" ? Math.min(executableUSDT / livePrice, position?.quantity ?? 0) : undefined,
      });
      setSnapshot(engine.snapshot());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label("Operação simulada recusada", "Simulated operation rejected", "Operación simulada rechazada"));
      setSnapshot(engine.snapshot());
    }
  }

  function reset() {
    engine.reset(); setTpPrice(undefined); setSlPrice(undefined); setError(""); setSnapshot(engine.snapshot());
  }

  function changeSymbol(next: Pair) {
    setTpPrice(undefined);
    setSlPrice(undefined);
    setError("");
    onSymbolChange?.(next);
  }

  function exportCsv() {
    const rows = [
      ["timestamp", "date", "side", "symbol", "price", "quantity", "notionalUSDT", "feeUSDT", "realizedPnl"],
      ...snapshot.trades.map((trade) => [
        String(trade.timestamp), new Date(trade.timestamp).toISOString(), trade.side, trade.symbol,
        String(trade.price), String(trade.quantity), String(trade.notionalQuote), String(trade.feeQuote), String(trade.realizedPnl),
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `radarcrypto_sim_${snapshot.trades.at(-1)?.timestamp ?? "sessao"}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  const fmt = (value: number, decimals = 2) => value.toLocaleString("en-US", { maximumFractionDigits: decimals });

  return (
    <div className="tcRoot">
      <div className="tcHead"><h3>{label("Controles de trading", "Trading controls", "Controles de trading")} · Spot SIM</h3><small className="muted">Fee 0.10% · Slippage 1 bps</small></div>
      <div className="tcGrid">
        <div className="col">
          <label className="lbl">{label("Par", "Pair", "Par")}</label><select className="inp" value={symbol} onChange={(event) => changeSymbol(event.target.value as Pair)}>{PAIRS.map((pair) => <option key={pair}>{pair}</option>)}</select>
          <label className="lbl">{label("Preço ao vivo", "Live price", "Precio en vivo")}</label><input className="inp" disabled value={livePrice ? fmt(livePrice, 8) : "—"} />
          <label className="lbl">{label("Limite de risco por operação", "Risk limit per trade", "Límite de riesgo por operación")} (%)</label><input className="inp" type="number" min={0.1} max={100} step={0.1} value={riskPct} onChange={(event) => setRiskPct(Number(event.target.value))} />
          <label className="lbl">{label("Tamanho solicitado", "Requested size", "Tamaño solicitado")} (USDT)</label><input className="inp" type="number" min={0} value={sizeUSDT} onChange={(event) => setSizeUSDT(Number(event.target.value))} />
          <small className="muted">{label("Executável após risco", "Executable after risk limit", "Ejecutable tras límite de riesgo")}: {fmt(executableUSDT)} USDT</small>
        </div>
        <div className="col">
          <Metric label={label("Saldo livre", "Free balance", "Saldo libre")} value={fmt(snapshot.cash)} />
          <Metric label="Equity" value={fmt(snapshot.equity)} />
          <Metric label={label("PNL realizado", "Realized PNL", "PNL realizado")} value={fmt(snapshot.realizedPnl)} />
          <Metric label={label("PNL não realizado", "Unrealized PNL", "PNL no realizado")} value={fmt(snapshot.unrealizedPnl)} />
          <Metric label={label("Posição", "Position", "Posición")} value={position ? `${position.quantity.toFixed(8)} @ ${fmt(position.averageEntryPrice, 8)}` : "—"} />
        </div>
        <div className="row twoCols"><label className="lbl">TP (preço)<input className="inp" type="number" value={tpPrice ?? ""} onChange={(event) => setTpPrice(event.target.value ? Number(event.target.value) : undefined)} /></label><label className="lbl">SL (preço)<input className="inp" type="number" value={slPrice ?? ""} onChange={(event) => setSlPrice(event.target.value ? Number(event.target.value) : undefined)} /></label></div>
        <div className="row twoCols"><button className="btn btnBuy" disabled={!livePrice || executableUSDT <= 0} onClick={() => execute("BUY")}>{t("actions.buy")}</button><button className="btn btnSell" disabled={!livePrice || !position} onClick={() => execute("SELL")}>{t("actions.sell")}</button></div>
        <div className="row twoCols"><button className="btn" onClick={reset}>{label("Resetar simulação", "Reset simulation", "Reiniciar simulación")}</button><button className="btn" onClick={exportCsv}>{label("Exportar CSV", "Export CSV", "Exportar CSV")}</button></div>
        {error && <div className="row pnlNeg">{error}</div>}
        <div className="row histCard"><strong>{label("Histórico", "History", "Historial")}</strong>{snapshot.trades.slice().reverse().slice(0, 15).map((trade) => <div key={trade.id} className="histLine"><span>{new Date(trade.timestamp).toLocaleString()}</span><span>{trade.side}</span><span>{trade.symbol}</span><span>{fmt(trade.price, 8)}</span><span>fee {fmt(trade.feeQuote, 4)}</span><span>PNL {fmt(trade.realizedPnl)}</span></div>)}</div>
      </div>
      <style jsx>{`
        .tcRoot{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px;height:100%;overflow:auto}.tcHead{display:flex;justify-content:space-between;align-items:center}.tcHead h3{margin:0}.tcGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.col{display:grid;gap:8px}.row{grid-column:1/-1}.twoCols{display:grid;grid-template-columns:1fr 1fr;gap:10px}.lbl{display:grid;gap:4px;font-size:12px;color:rgba(255,255,255,.75)}.inp{width:100%;height:36px;padding:0 10px;border-radius:10px;background:rgba(255,255,255,.05);color:inherit;border:1px solid rgba(255,255,255,.15)}.btn{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);border-radius:10px;color:inherit;padding:10px}.btnBuy{color:#1cff80}.btnSell{color:#ff6b6b}.histCard{display:grid;gap:6px}.histLine{display:grid;grid-template-columns:1.4fr .5fr .7fr 1fr .8fr .8fr;gap:5px;font-size:12px}.pnlNeg{color:#ff6b6b}@media(max-width:900px){.tcGrid{grid-template-columns:1fr}.row{grid-column:auto}.twoCols{grid-template-columns:1fr}.histLine{min-width:650px}}
      `}</style>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><small className="muted">{label}</small><div style={{ fontWeight: 800 }}>{value}</div></div>;
}
