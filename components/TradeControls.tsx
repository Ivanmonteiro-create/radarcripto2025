// components/TradeControls.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Trade = {
  id: string;
  time: string;
  side: "COMPRA" | "VENDA" | "RESET";
  symbol: string;
  price?: number;
  riskPct?: number;
};

const SYMBOLS = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","ADAUSDT","XRPUSDT","LINKUSDT","DOGEUSDT"];
const nf = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 6 });

async function fetchPrice(symbol: string): Promise<number> {
  const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, { cache: "no-store" });
  if (!r.ok) throw new Error("Erro ao buscar preço");
  const j = (await r.json()) as { price: string };
  return Number(j.price);
}

export default function TradeControls({
  symbol,
  onSymbolChange,
  isFullscreen,
  onEnterFullscreen,
  onExitFullscreen,
}: {
  symbol: string;
  onSymbolChange: (s: string) => void;
  isFullscreen?: boolean;
  onEnterFullscreen?: () => void;
  onExitFullscreen?: () => void;
}) {
  const [balance, setBalance] = useState<number>(10000);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [price, setPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [history, setHistory] = useState<Trade[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const p = await fetchPrice(symbol);
        if (mounted) { setPrice(p); setLoadingPrice(false); }
      } catch { if (mounted) setPrice(null); }
    };
    load();
    const t = setInterval(load, 8000);
    return () => { mounted = false; clearInterval(t); };
  }, [symbol]);

  const symbolLabel = useMemo(() => `${symbol.replace("USDT","")}/USDT`, [symbol]);

  function addToHistory(trade: Trade) { setHistory((h) => [trade, ...h].slice(0, 50)); }
  function onBuy()  { addToHistory({ id: crypto.randomUUID(), time: new Date().toLocaleString(), side: "COMPRA", symbol, price: price ?? undefined, riskPct }); }
  function onSell() { addToHistory({ id: crypto.randomUUID(), time: new Date().toLocaleString(), side: "VENDA",  symbol, price: price ?? undefined, riskPct }); }
  function onReset(){ setBalance(10000); setRiskPct(1); setHistory([]); addToHistory({ id: crypto.randomUUID(), time: new Date().toLocaleString(), side: "RESET", symbol }); }

  const riskValue = useMemo(() => (isFinite(balance) ? (balance * riskPct) / 100 : 0), [balance, riskPct]);

  return (
    <div>
      {/* Cabeçalho: só o ícone do fullscreen (mais forte/neutro) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h2 style={{ margin: 0, flex: 1 }}>Controles de Trade</h2>
        <button
          className="btn btn-fs-icon"
          onClick={() => (isFullscreen ? onExitFullscreen?.() : onEnterFullscreen?.())}
          title={isFullscreen ? "Sair (X/Esc)" : "Tela cheia (F)"}
          aria-label={isFullscreen ? "Sair de tela cheia" : "Entrar em tela cheia"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            {isFullscreen ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Par e preço */}
      <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
        <label className="small muted">Par</label>
        <select
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value)}
          style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,.03)", color: "inherit", border: "1px solid rgba(255,255,255,.12)" }}
        >
          {SYMBOLS.map((s) => (
            <option key={s} value={s}>{s.replace("USDT","")}/USDT</option>
          ))}
        </select>

        <div className="tickerCard" style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="tickerSymbol strong">{symbolLabel}</div>
          <div className="tickerPrice green">{loadingPrice ? "…" : price !== null ? nf.format(price) : "—"}</div>
        </div>
      </div>

      {/* Saldo e risco */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label className="small muted">Saldo (USDT)</label>
          <input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} min={0} style={inputStyle} />
        </div>
        <div>
          <label className="small muted">Risco por trade (%)</label>
          <input type="number" value={riskPct} onChange={(e) => setRiskPct(Number(e.target.value))} min={0} max={100} step={0.1} style={inputStyle} />
        </div>
      </div>

      <div className="small muted" style={{ marginTop: 6 }}>
        Risco estimado: <strong>{nf.format(riskValue)}</strong> USDT
      </div>

      {/* Ações */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
        <button onClick={onBuy} className="btn" style={btnBuy}>Comprar</button>
        <button onClick={onSell} className="btn" style={btnSell}>Vender</button>
        <button onClick={onReset} className="btn" style={btnReset}>Resetar</button>
      </div>

      {/* Histórico */}
      <div style={{ marginTop: 16 }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 16 }}>Histórico</h3>
        <div style={{ display: "grid", gap: 8, maxHeight: "32dvh", overflowY: "auto", paddingRight: 4 }}>
          {history.length === 0 && <div className="small muted">Sem operações ainda.</div>}
          {history.map((t) => (
            <div key={t.id} className="tickerCard" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8 }}>
              <span className="small muted">{t.time}</span>
              <span><strong>{t.side}</strong> • {t.symbol.replace("USDT","")}/USDT</span>
              <span className="small">{t.price ? nf.format(t.price) : "—"} {t.riskPct ? `• ${t.riskPct}%` : ""}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,255,255,.03)",
  color: "inherit",
  border: "1px solid rgba(255,255,255,.12)",
};
const btnBuy: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(33,243,141,.22), rgba(33,243,141,.10))",
  color: "#1cff80",
  border: "1px solid rgba(33,243,141,.35)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 800,
};
const btnSell: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,76,76,.20), rgba(255,76,76,.08))",
  color: "#ff6b6b",
  border: "1px solid rgba(255,76,76,.35)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 800,
};
const btnReset: React.CSSProperties = {
  background: "rgba(255,255,255,.06)",
  color: "inherit",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 700,
};
