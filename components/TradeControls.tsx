// components/TradeControls.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

/** ================================
 *  CONFIG
 *  ================================ */
const SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "ADAUSDT",
  "XRPUSDT",
  "LINKUSDT",
  "DOGEUSDT",
];

const FEE_RATE = 0.001; // 0.1% por lado (abertura e fechamento)

/** ================================
 *  TYPES
 *  ================================ */
type Side = "LONG" | "SHORT";
type TradeSideBtn = "COMPRA" | "VENDA";

type Position = {
  side: Side;
  symbol: string;
  entryPrice: number;
  qty: number; // quantidade (em unidades do ativo)
  entryTime: string; // ISO
  feesOpen: number; // USDT cobradas na abertura
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
  fees: number; // total (abertura + fechamento)
  pnl: number; // em USDT (já descontando fees)
  pnlPct: number; // sobre o notional de entrada
  balanceAfter: number; // saldo após fechar
};

type PersistShape = {
  balance: number;
  riskPct: number;
  symbol: string;
  position: Position | null;
  trades: ClosedTrade[];
};

const nf = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 6 });
const n2 = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 });

/** ================================
 *  HELPERS
 *  ================================ */
const STORAGE_KEY = "radarcrypto.sim.v1";

function loadPersist(): PersistShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistShape;
  } catch {
    return null;
  }
}
function savePersist(state: PersistShape) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function fetchPrice(symbol: string): Promise<number> {
  const r = await fetch(
    `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
    { cache: "no-store" }
  );
  if (!r.ok) throw new Error("Erro ao buscar preço");
  const j = (await r.json()) as { price: string };
  return Number(j.price);
}

function nowIso() {
  return new Date().toISOString();
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

/** ================================
 *  COMPONENT
 *  ================================ */
export default function TradeControls({
  symbol: symbolProp,
  onSymbolChange,
}: {
  symbol: string;
  onSymbolChange: (s: string) => void;
}) {
  // ---------- STATE ----------
  const [balance, setBalance] = useState<number>(10000);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [symbol, setSymbol] = useState<string>(symbolProp); // espelha props + persiste
  const [price, setPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [position, setPosition] = useState<Position | null>(null);
  const [trades, setTrades] = useState<ClosedTrade[]>([]);
  const loadedRef = useRef(false);

  // ---------- LOAD PERSIST ----------
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const p = loadPersist();
    if (p) {
      setBalance(p.balance ?? 10000);
      setRiskPct(p.riskPct ?? 1);
      setPosition(p.position ?? null);
      setTrades(Array.isArray(p.trades) ? p.trades : []);
      // símbolo persistido sobrepõe o atual
      if (p.symbol) {
        setSymbol(p.symbol);
        onSymbolChange(p.symbol);
      }
    } else {
      // garantir sincronismo com a page ao primeiro load
      setSymbol(symbolProp);
    }
  }, [symbolProp, onSymbolChange]);

  // ---------- SYNC symbol com page.tsx ----------
  useEffect(() => {
    if (symbol !== symbolProp) onSymbolChange(symbol);
  }, [symbol, symbolProp, onSymbolChange]);

  // ---------- PRICE POLLING ----------
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const p = await fetchPrice(symbol);
        if (mounted) {
          setPrice(p);
          setLoadingPrice(false);
        }
      } catch {
        if (mounted) setPrice(null);
      }
    };
    load();
    const t = setInterval(load, 8000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [symbol]);

  // ---------- PERSIST ON CHANGE ----------
  useEffect(() => {
    savePersist({
      balance,
      riskPct,
      symbol,
      position,
      trades,
    });
  }, [balance, riskPct, symbol, position, trades]);

  // ---------- DERIVED ----------
  const symbolLabel = useMemo(
    () => `${symbol.replace("USDT", "")}/USDT`,
    [symbol]
  );
  const equity = balance; // por enquanto, sem mark-to-market da posição aberta

  // Risco em USDT (apenas info visual)
  const riskValueUSDT = useMemo(
    () => (isFinite(balance) ? (balance * riskPct) / 100 : 0),
    [balance, riskPct]
  );

  // ---------- CORE LOGIC ----------
  /**
   * Define o tamanho da posição (qty) usando o risco % do saldo como "notional".
   * Ex.: 1% de 10.000 = 100 USDT; qty = 100 / price
   */
  function sizeFromRisk(p: number): number {
    const notional = riskValueUSDT > 0 ? riskValueUSDT : 100; // fallback
    if (!p || p <= 0) return 0;
    return notional / p;
  }

  /** Abre posição LONG ou SHORT */
  function openPosition(side: Side, p: number) {
    const qty = sizeFromRisk(p);
    if (qty <= 0) return;

    const notional = qty * p;
    const feesOpen = notional * FEE_RATE;

    setPosition({
      side,
      symbol,
      entryPrice: p,
      qty,
      entryTime: nowIso(),
      feesOpen,
    });
  }

  /** Fecha posição existente, calcula PnL e atualiza histórico/saldo */
  function closePosition(p: number) {
    if (!position) return;

    const { side, entryPrice, qty, feesOpen } = position;

    const notionalEntry = entryPrice * qty;
    const notionalExit = p * qty;
    const feesClose = notionalExit * FEE_RATE;
    const totalFees = feesOpen + feesClose;

    let gross = 0;
    if (side === "LONG") {
      gross = (p - entryPrice) * qty;
    } else {
      // SHORT
      gross = (entryPrice - p) * qty;
    }
    const pnl = gross - totalFees;
    const pnlPct = notionalEntry > 0 ? (pnl / notionalEntry) * 100 : 0;

    const newBalance = balance + pnl;

    const closed: ClosedTrade = {
      id: uid(),
      timeOpen: position.entryTime,
      timeClose: nowIso(),
      symbol,
      side,
      priceEntry: entryPrice,
      priceExit: p,
      qty,
      fees: totalFees,
      pnl,
      pnlPct,
      balanceAfter: newBalance,
    };

    setTrades((h) => [closed, ...h]);
    setPosition(null);
    setBalance(newBalance);
  }

  /** Botões COMPRA/VENDA (modo 1 posição por vez) */
  function onClickTrade(btn: TradeSideBtn) {
    if (!price) return; // sem preço não operamos
    if (!position) {
      // abrir nova posição
      if (btn === "COMPRA") openPosition("LONG", price);
      else openPosition("SHORT", price);
      return;
    }
    // já existe posição
    if (position.side === "LONG" && btn === "VENDA") {
      closePosition(price); // vender fecha long
      return;
    }
    if (position.side === "SHORT" && btn === "COMPRA") {
      closePosition(price); // comprar fecha short
      return;
    }
    // se clicar no mesmo lado, ignore (MVP)
  }

  /** Reset total */
  function onResetAll() {
    setBalance(10000);
    setRiskPct(1);
    setTrades([]);
    setPosition(null);
    // mantém o par atual
  }

  // ---------- RENDER ----------
  return (
    <div>
      {/* Header: título + voltar ao início */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h2 style={{ margin: 0, flex: 1 }}>Controles de Trade</h2>
        <Link href="/" className="btn btn-primary">Voltar ao início</Link>
      </div>

      {/* Equity / status da posição */}
      <div className="tickerCard" style={{ marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
        <span className="small muted">Equity</span>
        <strong>{n2.format(equity)} USDT</strong>
      </div>
      <div className="tickerCard" style={{ marginBottom: 12 }}>
        {position ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div><span className="small muted">Posição</span><div><strong>{position.side}</strong></div></div>
            <div><span className="small muted">Entrada</span><div>{nf.format(position.entryPrice)}</div></div>
            <div><span className="small muted">Qtd</span><div>{nf.format(position.qty)}</div></div>
          </div>
        ) : (
          <div className="small muted">Sem posição aberta.</div>
        )}
      </div>

      {/* Par e preço */}
      <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
        <label className="small muted">Par</label>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
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
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(Number(e.target.value))}
            min={0}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="small muted">Risco por trade (%)</label>
          <input
            type="number"
            value={riskPct}
            onChange={(e) => setRiskPct(Number(e.target.value))}
            min={0}
            max={100}
            step={0.1}
            style={inputStyle}
          />
        </div>
      </div>

      <div className="small muted" style={{ marginTop: 6 }}>
        Risco estimado (notional): <strong>{n2.format(riskValueUSDT)}</strong> USDT
      </div>

      {/* Ações */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
        <button onClick={() => onClickTrade("COMPRA")} className="btn" style={btnBuy}>
          {position?.side === "SHORT" ? "Fechar Short (Comprar)" : "Comprar"}
        </button>
        <button onClick={() => onClickTrade("VENDA")} className="btn" style={btnSell}>
          {position?.side === "LONG" ? "Fechar Long (Vender)" : "Vender"}
        </button>
        <button onClick={onResetAll} className="btn" style={btnReset}>Resetar</button>
      </div>

      {/* Histórico */}
      <div style={{ marginTop: 16 }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 16 }}>Histórico</h3>
        <div style={{ display: "grid", gap: 8, maxHeight: "32dvh", overflowY: "auto", paddingRight: 4 }}>
          {trades.length === 0 && <div className="small muted">Sem operações ainda.</div>}
          {trades.map((t) => (
            <div key={t.id} className="tickerCard" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8 }}>
              <span className="small muted">{new Date(t.timeClose).toLocaleString()}</span>
              <span>
                <strong>{t.side}</strong> • {t.symbol.replace("USDT","")}/USDT ·
                &nbsp;{nf.format(t.priceEntry)} → {nf.format(t.priceExit)} · Qtd {nf.format(t.qty)}
              </span>
              <span className="small" style={{ color: t.pnl >= 0 ? "#1cff80" : "#ff6b6b", fontWeight: 700 }}>
                {t.pnl >= 0 ? "+" : ""}{n2.format(t.pnl)} USDT ({n2.format(t.pnlPct)}%)
              </span>
              <div className="small muted" style={{ gridColumn: "1 / -1" }}>
                Taxas: {n2.format(t.fees)} · Saldo após: <strong>{n2.format(t.balanceAfter)} USDT</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** ================================
 *  STYLES INLINE
 *  ================================ */
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,255,255,.03)",
  color: "inherit",
  border: "1px solid rgba(255,255,255,.12)",
};

const btnBuy: React.CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(33,243,141,.22), rgba(33,243,141,.10))",
  color: "#1cff80",
  border: "1px solid rgba(33,243,141,.35)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 800,
};

const btnSell: React.CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(255,76,76,.20), rgba(255,76,76,.08))",
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
