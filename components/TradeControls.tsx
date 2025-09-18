// components/TradeControls.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

/* ===== CONFIG ===== */
const SYMBOLS = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","ADAUSDT","XRPUSDT","LINKUSDT","DOGEUSDT"];
const FEE_RATE = 0.001;              // 0,1% por lado
const PRICE_POLL_MS = 2000;          // pooling rápido
const HISTORY_SHOW = 3;              // mostrar só as 3 últimas no painel

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
const STORAGE_KEY = "radarcrypto.sim.v3.compact";

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
const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

/* ===== COMPONENT ===== */
export default function TradeControls({
  symbol: symbolProp,
  onSymbolChange,
}: {
  symbol: string;
  onSymbolChange: (s: string) => void;
}) {
  // estado
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

  // carregar persistência
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const p = loadPersist();
    if (p) {
      setBalance(p.balance ?? 10000);
      setRiskPct(p.riskPct ?? 1);
      setPosition(p.position ?? null);
      setTrades(Array.isArray(p.trades) ? p.trades : []);
      setSlPct(p.slPct ?? null); setTpPct(p.tpPct ?? null);
      setSlPriceInput(p.slPriceInput ?? null); setTpPriceInput(p.tpPriceInput ?? null);
      if (p.symbol) { setSymbol(p.symbol); onSymbolChange(p.symbol); } else { setSymbol(symbolProp); }
    } else {
      setSymbol(symbolProp);
    }
  }, [symbolProp, onSymbolChange]);

  // sync par
  useEffect(() => { if (symbol !== symbolProp) onSymbolChange(symbol); }, [symbol, symbolProp, onSymbolChange]);

  // preço + SL/TP
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

  // persistir
  useEffect(() => {
    savePersist({ balance, riskPct, symbol, position, trades, slPct, tpPct, slPriceInput, tpPriceInput });
  }, [balance, riskPct, symbol, position, trades, slPct, tpPct, slPriceInput, tpPriceInput]);

  // derivados
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

  // núcleo
  function sizeFromRisk(p: number) {
    const notional = riskValueUSDT > 0 ? riskValueUSDT : 100;
    return p > 0 ? notional / p : 0;
  }
  function deriveTargets(entry: number, side: Side) {
    const slFromPrice = (typeof slPriceInput === "number" && slPriceInput > 0) ? slPriceInput : null;
    const tpFromPrice = (typeof tpPriceInput === "number" && tpPriceInput > 0) ? tpPriceInput : null;
    let sl: number | undefined, tp: number | undefined;
    if (slFromPrice !== null) sl = slFromPrice;
    else if (typeof slPct === "number" && slPct > 0) sl = side === "LONG" ? entry * (1 - slPct/100) : entry * (1 + slPct/100);
    if (tpFromPrice !== null) tp = tpFromPrice;
    else if (typeof tpPct === "number" && tpPct > 0) tp = side === "LONG" ? entry * (1 + tpPct/100) : entry * (1 - tpPct/100);
    if (side === "LONG") { if (typeof sl === "number" && sl >= entry) sl = undefined; if (typeof tp === "number" && tp <= entry) tp = undefined; }
    else { if (typeof sl === "number" && sl <= entry) sl = undefined; if (typeof tp === "number" && tp >= entry) tp = undefined; }
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

  const canChangeSymbol = !position;

  return (
    <div className="compactRoot">
      {/* cabeçalho compacto */}
      <div className="compactHeader">
        <h2 className="compactTitle">Controles de Trade</h2>
        <Link href="/" className="btn btn-xs btn-primary">Voltar ao início</Link>
      </div>

      {/* Grid 2 colunas fixas */}
      <div className="compactGrid">
        {/* Coluna A – Inputs */}
        <div className="colA">
          {/* Par e preço */}
          <label className="lbl">Par</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            disabled={!canChangeSymbol}
            className={`inp ${!canChangeSymbol ? "inp-disabled" : ""}`}
          >
            {SYMBOLS.map((s) => <option key={s} value={s}>{s.replace("USDT","")}/USDT</option>)}
          </select>
          <div className="tickerRow">
            <div className="muted">{symbolLabel}</div>
            <div className="green">{loadingPrice ? "…" : price !== null ? nf.format(price) : "—"}</div>
          </div>

          {/* Saldo e risco */}
          <div className="twoCols">
            <div>
              <label className="lbl">Saldo (USDT)</label>
              <input type="number" value={balance} onChange={(e)=>setBalance(Number(e.target.value))} className="inp" min={0}/>
            </div>
            <div>
              <label className="lbl">Risco (%)</label>
              <input type="number" value={riskPct} onChange={(e)=>setRiskPct(Number(e.target.value))} className="inp" min={0} max={100} step={0.1}/>
            </div>
          </div>
          <div className="muted xs">Risco estimado: <strong>{n2.format((balance* riskPct)/100 || 0)}</strong> USDT</div>

          {/* SL/TP compactos */}
          <div className="cardMini">
            <div className="cardTitle">Stop Loss</div>
            <div className="twoCols">
              <input type="number" placeholder="%"
                value={slPct ?? ""} onChange={e=>setSlPct(e.target.value===""?null:Number(e.target.value))}
                className="inp" min={0} step={0.1}/>
              <input type="number" placeholder="Preço"
                value={slPriceInput ?? ""} onChange={e=>setSlPriceInput(e.target.value===""?null:Number(e.target.value))}
                className="inp" min={0} step={0.0001}/>
            </div>
          </div>
          <div className="cardMini">
            <div className="cardTitle">Take Profit</div>
            <div className="twoCols">
              <input type="number" placeholder="%"
                value={tpPct ?? ""} onChange={e=>setTpPct(e.target.value===""?null:Number(e.target.value))}
                className="inp" min={0} step={0.1}/>
              <input type="number" placeholder="Preço"
                value={tpPriceInput ?? ""} onChange={e=>setTpPriceInput(e.target.value===""?null:Number(e.target.value))}
                className="inp" min={0} step={0.0001}/>
            </div>
          </div>

          {/* Botões compactos */}
          <div className="threeCols">
            <button onClick={()=>onClickTrade("COMPRA")} className="btn btn-xs btnBuy">
              {position?.side === "SHORT" ? "Fechar Short" : "Comprar"}
            </button>
            <button onClick={()=>onClickTrade("VENDA")} className="btn btn-xs btnSell">
              {position?.side === "LONG" ? "Fechar Long" : "Vender"}
            </button>
            <button onClick={onResetAll} className="btn btn-xs">Resetar</button>
          </div>
        </div>

        {/* Coluna B – Status / Posição / Histórico */}
        <div className="colB">
          <div className="tickerRow">
            <div className="muted">Equity</div>
            <strong>{n2.format(equityLive)} USDT</strong>
          </div>

          <div className="cardMini">
            <div className="cardTitle">Posição</div>
            {position ? (
              <div className="posGrid">
                <div><span className="muted xs">Lado</span><div><strong>{position.side}</strong></div></div>
                <div><span className="muted xs">Entrada</span><div>{nf.format(position.entryPrice)}</div></div>
                <div><span className="muted xs">Qtd</span><div>{nf.format(position.qty)}</div></div>
                <div><span className="muted xs">SL</span><div>{typeof position.slPrice==="number"? nf.format(position.slPrice):"—"}</div></div>
                <div><span className="muted xs">TP</span><div>{typeof position.tpPrice==="number"? nf.format(position.tpPrice):"—"}</div></div>
                <div>
                  <span className="muted xs">PnL aberto</span>
                  <div style={{ color: pnlOpen >= 0 ? "#1cff80" : "#ff6b6b", fontWeight: 800 }}>
                    {pnlOpen>=0?"+":""}{n2.format(pnlOpen)} USDT ({n2.format(pnlOpenPct)}%)
                  </div>
                </div>
                <div style={{ gridColumn: "1/-1", textAlign: "right" }}>
                  <button className="btn btn-xs" onClick={()=> price && closePosition(price, "Manual")}>Fechar agora</button>
                </div>
              </div>
            ) : (
              <div className="muted xs">Sem posição aberta.</div>
            )}
          </div>

          <div className="cardMini">
            <div className="cardTitle">Histórico (últimos {HISTORY_SHOW})</div>
            <div className="histWrap">
              {trades.length === 0 && <div className="muted xs">Sem operações ainda.</div>}
              {trades.slice(0, HISTORY_SHOW).map((t)=>(
                <div key={t.id} className="histRow">
                  <div className="xs muted">{new Date(t.timeClose).toLocaleString()}</div>
                  <div className="xs">
                    <strong>{t.side}</strong> {t.symbol.replace("USDT","")}/USDT · {nf.format(t.priceEntry)}→{nf.format(t.priceExit)} · Q {nf.format(t.qty)} · <em>{t.exitReason}</em>
                  </div>
                  <div className="xs" style={{ color: t.pnl>=0?"#1cff80":"#ff6b6b", fontWeight:700 }}>
                    {t.pnl>=0?"+":""}{n2.format(t.pnl)} ({n2.format(t.pnlPct)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
