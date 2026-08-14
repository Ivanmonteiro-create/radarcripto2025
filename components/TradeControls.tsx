"use client";

import { useEffect, useState } from "react";
import { SimulationEngine } from "@/lib/trading/simulationEngine";
import { useI18n } from "@/components/i18n/LocaleProvider";
import BackHomeButton from "@/components/navigation/BackHomeButton";

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
      <div className="tcHead">
        <div className="tcHeadCopy">
          <h3>{label("Controles de trading", "Trading controls", "Controles de trading")}</h3>
          <span className="tcMode">Spot · SIM</span>
        </div>
        <span className="tcBack"><BackHomeButton /></span>
        <small className="tcCosts">Fee 0.10% · Slippage 1 bps</small>
      </div>
      <div className="tcSections">
        <section className="tcSection">
          <h4>{label("Mercado", "Market", "Mercado")}</h4>
          <div className="tcTwoCols">
            <label className="tcField"><span>{label("Par", "Pair", "Par")}</span><select className="tcInput" value={symbol} onChange={(event) => changeSymbol(event.target.value as Pair)}>{PAIRS.map((pair) => <option key={pair}>{pair}</option>)}</select></label>
            <Metric label={label("Preço ao vivo", "Live price", "Precio en vivo")} value={livePrice ? fmt(livePrice, 8) : "—"} />
          </div>
        </section>

        <section className="tcSection">
          <h4>{label("Capital e risco", "Capital and risk", "Capital y riesgo")}</h4>
          <div className="tcTwoCols">
            <Metric label={label("Saldo livre", "Free balance", "Saldo libre")} value={fmt(snapshot.cash)} />
            <Metric label="Equity" value={fmt(snapshot.equity)} />
            <label className="tcField"><span>{label("Limite de risco por operação", "Risk limit per trade", "Límite de riesgo por operación")} (%)</span><input className="tcInput" type="number" min={0.1} max={100} step={0.1} value={riskPct} onChange={(event) => setRiskPct(Number(event.target.value))} /></label>
            <label className="tcField"><span>{label("Tamanho solicitado", "Requested size", "Tamaño solicitado")} (USDT)</span><input className="tcInput" type="number" min={0} value={sizeUSDT} onChange={(event) => setSizeUSDT(Number(event.target.value))} /></label>
            <Metric className="tcMetricWide" label={label("Executável após risco", "Executable after risk limit", "Ejecutable tras límite de riesgo")} value={`${fmt(executableUSDT)} USDT`} />
          </div>
        </section>

        <section className="tcSection">
          <h4>{label("Posição e resultado", "Position and result", "Posición y resultado")}</h4>
          <div className="tcTwoCols">
            <Metric label={label("PNL realizado", "Realized PNL", "PNL realizado")} value={fmt(snapshot.realizedPnl)} />
            <Metric label={label("PNL não realizado", "Unrealized PNL", "PNL no realizado")} value={fmt(snapshot.unrealizedPnl)} />
            <Metric className="tcMetricWide" label={label("Posição", "Position", "Posición")} value={position ? `${position.quantity.toFixed(8)} @ ${fmt(position.averageEntryPrice, 8)}` : "—"} />
          </div>
        </section>

        <section className="tcSection">
          <h4>{label("Saída", "Exit", "Salida")}</h4>
          <div className="tcTwoCols"><label className="tcField"><span>TP ({label("preço", "price", "precio")})</span><input className="tcInput" type="number" value={tpPrice ?? ""} onChange={(event) => setTpPrice(event.target.value ? Number(event.target.value) : undefined)} /></label><label className="tcField"><span>SL ({label("preço", "price", "precio")})</span><input className="tcInput" type="number" value={slPrice ?? ""} onChange={(event) => setSlPrice(event.target.value ? Number(event.target.value) : undefined)} /></label></div>
        </section>

        <section className="tcSection tcActionSection">
          <h4>{label("Ações", "Actions", "Acciones")}</h4>
          <div className="tcTwoCols"><button className="tcButton tcBuy" disabled={!livePrice || executableUSDT <= 0} onClick={() => execute("BUY")}>{t("actions.buy")}</button><button className="tcButton tcSell" disabled={!livePrice || !position} onClick={() => execute("SELL")}>{t("actions.sell")}</button></div>
          <div className="tcTwoCols"><button className="tcButton tcSecondary" onClick={reset}>{label("Resetar simulação", "Reset simulation", "Reiniciar simulación")}</button><button className="tcButton tcSecondary" onClick={exportCsv}>{label("Exportar CSV", "Export CSV", "Exportar CSV")}</button></div>
        </section>

        {error && <div className="tcError">{error}</div>}
        <section className="tcSection tcHistory"><h4>{label("Histórico", "History", "Historial")}</h4><div className="tcHistoryScroll">{snapshot.trades.slice().reverse().slice(0, 15).map((trade) => <div key={trade.id} className="tcHistoryLine"><span>{new Date(trade.timestamp).toLocaleString()}</span><span>{trade.side}</span><span>{trade.symbol}</span><span>{fmt(trade.price, 8)}</span><span>fee {fmt(trade.feeQuote, 4)}</span><span>PNL {fmt(trade.realizedPnl)}</span></div>)}</div></section>
      </div>
      <style jsx global>{`
        .tcRoot,.tcRoot *{box-sizing:border-box}.tcRoot{width:100%;min-width:0;height:100%;overflow:auto;padding:16px;background:linear-gradient(180deg,rgba(9,28,18,.96),rgba(3,14,9,.98));color:#e6fff2}.tcHead{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 12px;align-items:start;padding:2px 2px 15px;border-bottom:1px solid rgba(50,219,127,.16)}.tcHeadCopy{display:grid;gap:4px}.tcHead h3{margin:0;color:#effff6;font-size:17px;line-height:1.15;letter-spacing:-.01em}.tcMode{width:max-content;padding:3px 7px;border:1px solid rgba(45,224,128,.34);border-radius:999px;color:#68f5a5;background:rgba(24,226,115,.07);font-size:10px;font-weight:800;letter-spacing:.08em}.tcCosts{grid-column:1/-1;color:rgba(216,248,229,.55);font-size:10px;letter-spacing:.02em}.tcBack .rc-back-home{min-height:28px;padding:0 9px;font-size:10px;white-space:nowrap}.tcBack .rc-back-home>span:first-child{width:16px;height:16px}.tcSections{display:grid;gap:10px;padding-top:12px}.tcSection{display:grid;gap:9px;padding:11px;border:1px solid rgba(61,221,132,.15);border-radius:12px;background:rgba(255,255,255,.018)}.tcSection h4{margin:0;color:rgba(121,247,174,.72);font-size:10px;font-weight:850;letter-spacing:.12em;text-transform:uppercase}.tcTwoCols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}.tcField{display:grid;align-content:start;gap:6px;min-width:0;color:rgba(224,248,234,.66);font-size:10px;line-height:1.25}.tcInput{width:100%;height:40px;min-width:0;padding:0 10px;border:1px solid rgba(114,232,165,.18);border-radius:9px;background:rgba(2,12,8,.76);color:#eafff3;font:inherit;font-size:13px;outline:none}.tcInput:focus{border-color:rgba(36,231,124,.72);box-shadow:0 0 0 2px rgba(24,226,115,.1)}.tcMetric{display:grid;align-content:center;gap:5px;min-width:0;min-height:64px;padding:9px 10px;border:1px solid rgba(114,232,165,.14);border-radius:9px;background:rgba(2,12,8,.58)}.tcMetricWide{grid-column:1/-1}.tcMetricLabel{color:rgba(224,248,234,.58);font-size:10px;line-height:1.2}.tcMetricValue{overflow:hidden;color:#effff6;font-size:13px;font-weight:800;line-height:1.25;text-overflow:ellipsis}.tcActionSection{gap:8px}.tcButton{height:40px;border-radius:9px;font:inherit;font-size:12px;font-weight:800;cursor:pointer;transition:border-color .15s,background .15s,color .15s}.tcButton:disabled{cursor:not-allowed;opacity:.38}.tcBuy{border:1px solid rgba(34,235,124,.55);background:rgba(24,226,115,.1);color:#41f58f}.tcSell{border:1px solid rgba(255,100,112,.5);background:rgba(255,75,89,.08);color:#ff7882}.tcBuy:not(:disabled):hover{background:rgba(24,226,115,.18)}.tcSell:not(:disabled):hover{background:rgba(255,75,89,.15)}.tcSecondary{border:1px solid rgba(210,245,225,.16);background:rgba(255,255,255,.035);color:rgba(232,255,242,.8)}.tcSecondary:hover{border-color:rgba(81,225,145,.32);background:rgba(24,226,115,.06)}.tcError{padding:10px;border:1px solid rgba(255,107,107,.3);border-radius:9px;background:rgba(255,75,75,.07);color:#ff8b8b;font-size:11px}.tcHistory{padding-bottom:12px}.tcHistoryScroll{overflow-x:auto}.tcHistoryLine{display:grid;grid-template-columns:1.4fr .5fr .7fr 1fr .8fr .8fr;gap:5px;min-width:650px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:11px;color:rgba(232,255,242,.72)}
        @media(max-width:720px){.tcRoot{padding:12px}.tcHead{padding-top:0}.tcBack .rc-back-home{min-height:28px}.tcSections{gap:9px}.tcSection{padding:10px}.tcTwoCols{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.tcInput{height:42px}.tcHistoryLine{min-width:620px}}
        @media(max-width:420px){.tcTwoCols{grid-template-columns:1fr}.tcMetricWide{grid-column:auto}.tcHead h3{font-size:16px}.tcBack .rc-back-home>span:last-child{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}.tcBack .rc-back-home{width:28px;padding:0;justify-content:center}}
      `}</style>
    </div>
  );
}

function Metric({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return <div className={`tcMetric ${className}`}><small className="tcMetricLabel">{label}</small><div className="tcMetricValue">{value}</div></div>;
}
