"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

/* ===== CONFIG ===== */
const SYMBOLS = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","ADAUSDT","XRPUSDT","LINKUSDT","DOGEUSDT"];
const FEE_RATE = 0.001;
const PRICE_POLL_MS = 2000;
const HISTORY_SHOW = 50;

/* ===== TIPOS ===== */
type Side = "LONG" | "SHORT";
type TradeSideBtn = "COMPRA" | "VENDA";
type ExitReason = "Manual" | "SL" | "TP";

type Position = {
  side: Side;
  symbol: string;
  entryPrice: number;
  qty: number;
  entryTime: string;
  feesOpen: number;
  slPrice?: number;
  tpPrice?: number;
};

type ClosedTrade = {
  id: string;
  timeOpen: string;
  timeClose: string;
  symbol: string;
  side: Side;
  priceEntry: number;
  priceExit: number;
  qty: number;
  fees: number;
  pnl: number;
  pnlPct: number;
  balanceAfter: number;
  exitReason: ExitReason;
};

type PersistShape = {
  balance: number;
  riskPct: number;
  symbol: string;
  position: Position | null;
  trades: ClosedTrade[];
  slPct?: number | null;
  tpPct?: number | null;
  slPriceInput?: number | null;
  tpPriceInput?: number | null;
};

const nf = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 6 });
const n2 = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 });

/* ===== HELPERS ===== */
const STORAGE_KEY = "radarcrypto.sim.v5";

function loadPersist(): PersistShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistShape) : null;
  } catch { return null; }
}
function savePersist(state: PersistShape) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
async function fetchPrice(symbol: string): Promise<number> {
  const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, { cache: "no-store" });
  if (!r.ok) throw new Error("Erro ao buscar preço");
  const j = (await r.json()) as { price: string };
  return Number(j.price);
}
const nowIso = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2);

/* ===== COMPONENT ===== */
export default function TradeControls({
  symbol: symbolProp,
  onSymbolChange,
}: {
  symbol: string;
  onSymbolChange: (s: string) => void;
}) {
  const [balance, setBalance] = useState<number>(10000);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [symbol, setSymbol] = useState<string>(symbolProp);
  const [price, setPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [position, setPosition] = useState<Position | null>(null);
  const [trades, setTrades] = useState<ClosedTrade[]>([]);
  const loadedRef = useRef(false);

  const [slPct, setSlPct] = useState<number | null>(null);
  const [tpPct, setTpPct] = useState<number | null>(null);
  const [slPriceInput, setSlPriceInput] = useState<number | null>(null);
  const [tpPriceInput, setTpPriceInput] = useState<number | null>(null);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const p = loadPersist();
    if (p) {
      setBalance(p.balance ?? 10000);
      setRiskPct(p.riskPct ?? 1);
      setPosition(p.position ?? null);
      setTrades(Array.isArray(p.trades) ? p.trades : []);
      setSlPct(p.slPct ?? null);
      setTpPct(p.tpPct ?? null);
      setSlPriceInput(p.slPriceInput ?? null);
      setTpPriceInput(p.tpPriceInput ?? null);
      if (p.symbol) {
        setSymbol(p.symbol);
        onSymbolChange(p.symbol);
      } else {
        setSymbol(symbolProp);
      }
    } else {
      setSymbol(symbolProp);
    }
  }, [symbolProp, onSymbolChange]);

  useEffect(() => { if (symbol !== symbolProp) onSymbolChange(symbol); }, [symbol, symbolProp, onSymbolChange]);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const p = await fetchPrice(symbol);
        if (!mounted) return;
        setPrice(p); setLoadingPrice(false);
        if (position) {
          const { side, slPrice, tpPrice } = position;
          if (side === "LONG") {
            if (typeof slPrice === "number" && p <= slPrice) return closePosition(p, "SL");
            if (typeof tpPrice === "number" && p >= tpPrice) return closePosition(p, "TP");
          } else {
            if (typeof slPrice === "number" && p >= slPrice) return closePosition(p, "SL");
            if (typeof tpPrice === "number" && p <= tpPrice) return closePosition(p, "TP");
          }
        }
      } catch { if (mounted) setPrice(null); }
    };
    check();
    const t = setInterval(check, PRICE_POLL_MS);
    return () => { mounted = false; clearInterval(t); };
  }, [symbol, position]);

  useEffect(() => {
    savePersist({ balance, riskPct, symbol, position, trades, slPct, tpPct, slPriceInput, tpPriceInput });
  }, [balance, riskPct, symbol, position, trades, slPct, tpPct, slPriceInput, tpPriceInput]);

  const symbolLabel = useMemo(() => `${symbol.replace("USDT", "")}/USDT`, [symbol]);
  const riskValueUSDT = useMemo(() => (isFinite(balance) ? (balance * riskPct) / 100 : 0), [balance, riskPct]);
  const pnlOpen = useMemo(() => {
    if (!position || !price) return 0;
    const diff = position.side === "LONG" ? price - position.entryPrice : position.entryPrice - price;
    return diff * position.qty;
  }, [position, price]);
  const pnlOpenPct = useMemo(() => {
    if (!position || !price) return 0;
    const notional = position.entryPrice * position.qty;
    return notional > 0 ? (pnlOpen / notional) * 100 : 0;
  }, [position, price, pnlOpen]);
  const equityLive = useMemo(() => balance + (pnlOpen || 0), [balance, pnlOpen]);

  const tradeCount = trades.length;
  const winCount = trades.filter(t => t.pnl > 0).length;
  const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;
  const totalPnl = trades.reduce((acc, t) => acc + t.pnl, 0);

  function sizeFromRisk(p: number) {
    const notional = riskValueUSDT > 0 ? riskValueUSDT : 100;
    return p > 0 ? notional / p : 0;
  }
  function deriveTargets(entry: number, side: Side) {
    const slFromPrice = slPriceInput || null;
    const tpFromPrice = tpPriceInput || null;
    let sl: number | undefined, tp: number | undefined;
    if (slFromPrice) sl = slFromPrice;
    else if (slPct) sl = side === "LONG" ? entry * (1 - slPct/100) : entry * (1 + slPct/100);
    if (tpFromPrice) tp = tpFromPrice;
    else if (tpPct) tp = side === "LONG" ? entry * (1 + tpPct/100) : entry * (1 - tpPct/100);
    return { sl, tp };
  }
  function openPosition(side: Side, p: number) {
    const qty = sizeFromRisk(p); if (qty <= 0) return;
    const feesOpen = (qty * p) * FEE_RATE;
    const { sl, tp } = deriveTargets(p, side);
    setPosition({ side, symbol, entryPrice: p, qty, entryTime: nowIso(), feesOpen, slPrice: sl, tpPrice: tp });
  }
  function closePosition(p: number, reason: ExitReason) {
    if (!position) return;
    const { side, entryPrice, qty, feesOpen } = position;
    const notionalEntry = entryPrice * qty;
    const notionalExit  = p * qty;
    const feesClose = notionalExit * FEE_RATE;
    const pnlGross = side === "LONG" ? (p - entryPrice) * qty : (entryPrice - p) * qty;
    const pnl = pnlGross - (feesOpen + feesClose);
    const pnlPct = notionalEntry > 0 ? (pnl / notionalEntry) * 100 : 0;
    const newBalance = balance + pnl;
    setTrades(h => [{ id: uid(), timeOpen: position.entryTime, timeClose: nowIso(), symbol, side, priceEntry: entryPrice, priceExit: p, qty, fees: feesOpen + feesClose, pnl, pnlPct, balanceAfter: newBalance, exitReason: reason }, ...h]);
    setPosition(null);
    setBalance(newBalance);
  }
  function onClickTrade(btn: TradeSideBtn) {
    if (!price) return;
    if (!position) {
      if (btn === "COMPRA") openPosition("LONG", price); else openPosition("SHORT", price);
      return;
    }
    if (position.side === "LONG" && btn === "VENDA") return closePosition(price, "Manual");
    if (position.side === "SHORT" && btn === "COMPRA") return closePosition(price, "Manual");
  }
  function onResetAll() {
    setBalance(10000); setRiskPct(1); setTrades([]); setPosition(null);
  }

  return (
    <div className="compactRoot">
      <div className="compactHeader">
        <h2 className="compactTitle">Controles de Trade</h2>
        <Link href="/" className="btn btn-xs btn-primary">Voltar ao início</Link>
      </div>

      <div className="compactGrid">
        {/* Coluna A */}
        <div className="colA">
          <label className="lbl">Par</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="inp"
          >
            {SYMBOLS.map((s) => <option key={s} value={s}>{s.replace("USDT","")}/USDT</option>)}
          </select>
          <div className="tickerRow">
            <div className="muted">{symbolLabel}</div>
            <div className="green">{loadingPrice ? "…" : price !== null ? nf.format(price) : "—"}</div>
          </div>

          <div className="twoCols">
            <div>
              <label className="lbl">Saldo (USDT)</label>
              <input type="number" value={balance} onChange={(e)=>setBalance(Number(e.target.value))} className="inp"/>
            </div>
            <div>
              <label className="lbl">Risco (%)</label>
              <input type="number" value={riskPct} onChange={(e)=>setRiskPct(Number(e.target.value))} className="inp"/>
            </div>
          </div>
          <div className="muted xs">Risco estimado: <strong>{n2.format((balance* riskPct)/100 || 0)}</strong> USDT</div>

          <div className="cardMini">
            <div className="cardTitle">Stop Loss</div>
            <div className="twoCols">
              <input type="number" placeholder="%" value={slPct ?? ""} onChange={e=>setSlPct(e.target.value===""?null:Number(e.target.value))} className="inp"/>
              <input type="number" placeholder="Preço" value={slPriceInput ?? ""} onChange={e=>setSlPriceInput(e.target.value===""?null:Number(e.target.value))} className="inp"/>
            </div>
          </div>
          <div className="cardMini">
            <div className="cardTitle">Take Profit</div>
            <div className="twoCols">
              <input type="number" placeholder="%" value={tpPct ?? ""} onChange={e=>setTpPct(e.target.value===""?null:Number(e.target.value))} className="inp"/>
              <input type="number" placeholder="Preço" value={tpPriceInput ?? ""} 
                onChange={e=>setTpPriceInput(e.target.value==="" ? null : Number(e.target.value))} 
                className="inp"/>
            </div>
          </div>

          <div className="threeCols">
            <button onClick={()=>onClickTrade("COMPRA")} className="btn btn-xs btnBuy">Comprar</button>
            <button onClick={()=>onClickTrade("VENDA")} className="btn btn-xs btnSell">Vender</button>
            <button onClick={onResetAll} className="btn btn-xs">Resetar</button>
          </div>
        </div>

        {/* Coluna B */}
        <div className="colB">
          <div className="tickerRow">
            <div className="muted">Equity</div>
            <strong>{n2.format(equityLive)} USDT</strong>
          </div>

          <div className="cardMini">
            <div className="cardTitle">Posição</div>
            {position ? (
              <div className="posGrid">
                <div><span className="muted xs">Lado</span><div>{position.side}</div></div>
                <div><span className="muted xs">Entrada</span><div>{nf.format(position.entryPrice)}</div></div>
                <div><span className="muted xs">Qtd</span><div>{nf.format(position.qty)}</div></div>
                <div><span className="muted xs">PnL aberto</span><div style={{color:pnlOpen>=0?"#1cff80":"#ff6b6b"}}>{n2.format(pnlOpen)} USDT</div></div>
                <div style={{gridColumn:"1/-1",textAlign:"right"}}><button className="btn btn-xs" onClick={()=> price && closePosition(price,"Manual")}>Fechar</button></div>
              </div>
            ) : (<div className="muted xs">Sem posição aberta</div>)}
          </div>

          <div className="kpiGrid">
            <div className="kpiCard"><div className="kpiLabel">Trades</div><div className="kpiValue">{tradeCount}</div></div>
            <div className="kpiCard"><div className="kpiLabel">Win rate</div><div className="kpiValue">{n2.format(winRate)}%</div></div>
            <div className="kpiCard"><div className="kpiLabel">PnL</div><div className="kpiValue" style={{color:totalPnl>=0?"#1cff80":"#ff6b6b"}}>{totalPnl>=0?"+":""}{n2.format(totalPnl)}</div></div>
          </div>

          <div className="cardMini historyCard">
            <div className="cardTitle">Histórico</div>
            <div className="histWrap fill">
              {trades.length === 0 && <div className="muted xs">Sem operações</div>}
              {trades.slice(0, HISTORY_SHOW).map((t)=>(
                <div key={t.id} className="histRow">
                  <div className="xs muted">{new Date(t.timeClose).toLocaleString()}</div>
                  <div className="xs"><strong>{t.side}</strong> {t.symbol.replace("USDT","")}/USDT</div>
                  <div className="xs" style={{color:t.pnl>=0?"#1cff80":"#ff6b6b"}}>{t.pnl>=0?"+":""}{n2.format(t.pnl)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
