// components/TradeControls.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

/* =========================================
 * CONFIG
 * ======================================= */
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
const PRICE_POLL_MS = 2000; // pooling mais rápido para sensação “tempo real”

/* =========================================
 * TIPOS
 * ======================================= */
type Side = "LONG" | "SHORT";
type TradeSideBtn = "COMPRA" | "VENDA";
type ExitReason = "Manual" | "SL" | "TP";

type Position = {
  side: Side;
  symbol: string;
  entryPrice: number;
  qty: number; // unidades do ativo
  entryTime: string; // ISO
  feesOpen: number; // USDT na abertura
  slPrice?: number; // preço alvo do stop
  tpPrice?: number; // preço alvo do take
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
  exitReason: ExitReason;
};

type PersistShape = {
  balance: number;
  riskPct: number;
  symbol: string;
  position: Position | null;
  trades: ClosedTrade[];
  // preferências dos inputs SL/TP (prático para retomar)
  slPct?: number | null;
  tpPct?: number | null;
  slPriceInput?: number | null;
  tpPriceInput?: number | null;
};

const nf = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 6 });
const n2 = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 });

/* =========================================
 * HELPERS
 * ======================================= */
const STORAGE_KEY = "radarcrypto.sim.v2";

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

/* =========================================
 * COMPONENTE
 * ======================================= */
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
  const [symbol, setSymbol] = useState<string>(symbolProp);

  const [price, setPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  const [position, setPosition] = useState<Position | null>(null);
  const [trades, setTrades] = useState<ClosedTrade[]>([]);
  const loadedRef = useRef(false);

  // Inputs SL/TP (o usuário pode preencher por % ou por preço).
  const [slPct, setSlPct] = useState<number | null>(null);
  const [tpPct, setTpPct] = useState<number | null>(null);
  const [slPriceInput, setSlPriceInput] = useState<number | null>(null);
  const [tpPriceInput, setTpPriceInput] = useState<number | null>(null);

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
      if (p.symbol) {
        setSymbol(p.symbol);
        onSymbolChange(p.symbol);
      } else {
        setSymbol(symbolProp);
      }
      setSlPct(p.slPct ?? null);
      setTpPct(p.tpPct ?? null);
      setSlPriceInput(p.slPriceInput ?? null);
      setTpPriceInput(p.tpPriceInput ?? null);
    } else {
      setSymbol(symbolProp);
    }
  }, [symbolProp, onSymbolChange]);

  // ---------- SYNC symbol com page.tsx ----------
  useEffect(() => {
    if (symbol !== symbolProp) onSymbolChange(symbol);
  }, [symbol, symbolProp, onSymbolChange]);

  // ---------- PRICE POLLING (2s) + auto SL/TP ----------
  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const p = await fetchPrice(symbol);
        if (!mounted) return;
        setPrice(p);
        setLoadingPrice(false);

        // Se houver posição, checar SL/TP
        if (position) {
          const { side, slPrice, tpPrice } = position;

          // executa SL/TP quando tocar
          if (side === "LONG") {
            if (typeof slPrice === "number" && p <= slPrice) {
              closePosition(p, "SL");
              return;
            }
            if (typeof tpPrice === "number" && p >= tpPrice) {
              closePosition(p, "TP");
              return;
            }
          } else if (side === "SHORT") {
            if (typeof slPrice === "number" && p >= slPrice) {
              closePosition(p, "SL");
              return;
            }
            if (typeof tpPrice === "number" && p <= tpPrice) {
              closePosition(p, "TP");
              return;
            }
          }
        }
      } catch {
        if (mounted) setPrice(null);
      }
    };

    check();
    const t = setInterval(check, PRICE_POLL_MS);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [symbol, position]);

  // ---------- PERSIST ON CHANGE ----------
  useEffect(() => {
    savePersist({
      balance,
      riskPct,
      symbol,
      position,
      trades,
      slPct,
      tpPct,
      slPriceInput,
      tpPriceInput,
    });
  }, [balance, riskPct, symbol, position, trades, slPct, tpPct, slPriceInput, tpPriceInput]);

  // ---------- DERIVED ----------
  const symbolLabel = useMemo(
    () => `${symbol.replace("USDT", "")}/USDT`,
    [symbol]
  );

  // Risco em USDT (info visual)
  const riskValueUSDT = useMemo(
    () => (isFinite(balance) ? (balance * riskPct) / 100 : 0),
    [balance, riskPct]
  );

  // PnL aberto (mark-to-market) e equity ao vivo
  const pnlOpen = useMemo(() => {
    if (!position || !price) return 0;
    const diff =
      position.side === "LONG"
        ? price - position.entryPrice
        : position.entryPrice - price;
    return diff * position.qty;
  }, [position, price]);

  const equityLive = useMemo(() => balance + (pnlOpen || 0), [balance, pnlOpen]);

  // ---------- CORE ----------
  function sizeFromRisk(p: number): number {
    const notional = riskValueUSDT > 0 ? riskValueUSDT : 100;
    if (!p || p <= 0) return 0;
    return notional / p;
  }

  // Converte inputs SL/TP em preços a partir do preço de entrada
  function deriveTargets(entry: number, side: Side) {
    // Preferência: se usuário informar preço, usa preço. Se não, usa % (se houver).
    const slFromPrice =
      typeof slPriceInput === "number" && slPriceInput > 0
        ? slPriceInput
        : null;
    const tpFromPrice =
      typeof tpPriceInput === "number" && tpPriceInput > 0
        ? tpPriceInput
        : null;

    let sl: number | undefined;
    let tp: number | undefined;

    if (slFromPrice !== null) {
      sl = slFromPrice;
    } else if (typeof slPct === "number" && slPct > 0) {
      const factor = slPct / 100;
      sl =
        side === "LONG" ? entry * (1 - factor) : entry * (1 + factor);
    }

    if (tpFromPrice !== null) {
      tp = tpFromPrice;
    } else if (typeof tpPct === "number" && tpPct > 0) {
      const factor = tpPct / 100;
      tp =
        side === "LONG" ? entry * (1 + factor) : entry * (1 - factor);
    }

    // validações simples para não aceitar SL inválido
    if (side === "LONG") {
      if (typeof sl === "number" && sl >= entry) sl = undefined;
      if (typeof tp === "number" && tp <= entry) tp = undefined;
    } else {
      if (typeof sl === "number" && sl <= entry) sl = undefined;
      if (typeof tp === "number" && tp >= entry) tp = undefined;
    }

    return { sl, tp };
  }

  function openPosition(side: Side, p: number) {
    const qty = sizeFromRisk(p);
    if (qty <= 0) return;

    const notional = qty * p;
    const feesOpen = notional * FEE_RATE;

    const { sl, tp } = deriveTargets(p, side);

    setPosition({
      side,
      symbol,
      entryPrice: p,
      qty,
      entryTime: nowIso(),
      feesOpen,
      slPrice: sl,
      tpPrice: tp,
    });
  }

  function closePosition(p: number, reason: ExitReason) {
    if (!position) return;

    const { side, entryPrice, qty, feesOpen } = position;
    const notionalEntry = entryPrice * qty;
    const notionalExit = p * qty;
    const feesClose = notionalExit * FEE_RATE;
    const totalFees = feesOpen + feesClose;

    let gross = 0;
    if (side === "LONG") gross = (p - entryPrice) * qty;
    else gross = (entryPrice - p) * qty;

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
      exitReason: reason,
    };

    setTrades((h) => [closed, ...h]);
    setPosition(null);
    setBalance(newBalance);
  }

  function onClickTrade(btn: TradeSideBtn) {
    if (!price) return;
    if (!position) {
      // abrir nova posição
      if (btn === "COMPRA") openPosition("LONG", price);
      else openPosition("SHORT", price);
      return;
    }
    // já existe posição
    if (position.side === "LONG" && btn === "VENDA") {
      closePosition(price, "Manual");
      return;
    }
    if (position.side === "SHORT" && btn === "COMPRA") {
      closePosition(price, "Manual");
      return;
    }
  }

  function onResetAll() {
    setBalance(10000);
    setRiskPct(1);
    setTrades([]);
    setPosition(null);
    // mantém símbolo e campos SL/TP
  }

  // ---------- RENDER ----------
  const canChangeSymbol = !position; // bloquear troca com posição aberta

  const pnlOpenPct = useMemo(() => {
    if (!position || !price) return 0;
    const notional = position.entryPrice * position.qty;
    if (notional <= 0) return 0;
    return (pnlOpen / notional) * 100;
  }, [position, price, pnlOpen]);

  return (
    <div>
      {/* Header: título + voltar ao início */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h2 style={{ margin: 0, flex: 1 }}>Controles de Trade</h2>
        <Link href="/" className="btn btn-primary">Voltar ao início</Link>
      </div>

      {/* Equity ao vivo */}
      <div className="tickerCard" style={{ marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
        <span className="small muted">Equity</span>
        <strong>{n2.format(equityLive)} USDT</strong>
      </div>

      {/* Posição atual */}
      <div className="tickerCard" style={{ marginBottom: 12 }}>
        {position ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
            <div>
              <span className="small muted">Posição</span>
              <div><strong>{position.side}</strong></div>
            </div>
            <div>
              <span className="small muted">Entrada</span>
              <div>{nf.format(position.entryPrice)}</div>
            </div>
            <div>
              <span className="small muted">Qtd</span>
              <div>{nf.format(position.qty)}</div>
            </div>
            <div>
              <span className="small muted">SL</span>
              <div>{typeof position.slPrice === "number" ? nf.format(position.slPrice) : "—"}</div>
            </div>
            <div>
              <span className="small muted">TP</span>
              <div>{typeof position.tpPrice === "number" ? nf.format(position.tpPrice) : "—"}</div>
            </div>
            <div>
              <span className="small muted">PnL aberto</span>
              <div style={{ color: pnlOpen >= 0 ? "#1cff80" : "#ff6b6b", fontWeight: 800 }}>
                {pnlOpen >= 0 ? "+" : ""}{n2.format(pnlOpen)} USDT ({n2.format(pnlOpenPct)}%)
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
              <button
                className="btn"
                onClick={() => price && closePosition(price, "Manual")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,.18)",
                  background: "rgba(255,255,255,.06)",
                  fontWeight: 700,
                }}
              >
                Fechar agora
              </button>
            </div>
          </div>
        ) : (
          <div className="small muted">Sem posição aberta.</div>
        )}
      </div>

      {/* Par e preço (bloqueia troca se houver posição) */}
      <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
        <label className="small muted">Par</label>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          disabled={!canChangeSymbol}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            background: canChangeSymbol ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.08)",
            color: "inherit",
            border: "1px solid rgba(255,255,255,.12)",
            cursor: canChangeSymbol ? "pointer" : "not-allowed",
          }}
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

      {/* SL/TP */}
      <div style={{ marginTop: 12 }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 16 }}>Stops e Alvos</h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
          <div className="tickerCard" style={{ display: "grid", gap: 8 }}>
            <strong>Stop Loss</strong>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label className="small muted">% (ex.: 2)</label>
                <input
                  type="number"
                  value={slPct ?? ""}
                  onChange={(e) => setSlPct(e.target.value === "" ? null : Number(e.target.value))}
                  min={0}
                  step={0.1}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="small muted">Preço</label>
                <input
                  type="number"
                  value={slPriceInput ?? ""}
                  onChange={(e) => setSlPriceInput(e.target.value === "" ? null : Number(e.target.value))}
                  min={0}
                  step={0.0001}
                  style={inputStyle}
                />
              </div>
            </div>
            <div className="small muted">
              Se preencher **preço**, ele tem prioridade sobre o **%**.
            </div>
          </div>

          <div className="tickerCard" style={{ display: "grid", gap: 8 }}>
            <strong>Take Profit</strong>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label className="small muted">% (ex.: 4)</label>
                <input
                  type="number"
                  value={tpPct ?? ""}
                  onChange={(e) => setTpPct(e.target.value === "" ? null : Number(e.target.value))}
                  min={0}
                  step={0.1}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="small muted">Preço</label>
                <input
                  type="number"
                  value={tpPriceInput ?? ""}
                  onChange={(e) => setTpPriceInput(e.target.value === "" ? null : Number(e.target.value))}
                  min={0}
                  step={0.0001}
                  style={inputStyle}
                />
              </div>
            </div>
            <div className="small muted">
              Se preencher **preço**, ele tem prioridade sobre o **%**.
            </div>
          </div>
        </div>
      </div>

      {/* BOTÕES */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
        <button onClick={() => onClickTrade("COMPRA")} className="btn" style={btnBuy}>
          {position?.side === "SHORT" ? "Fechar Short (Comprar)" : "Comprar"}
        </button>
        <button onClick={() => onClickTrade("VENDA")} className="btn" style={btnSell}>
          {position?.side === "LONG" ? "Fechar Long (Vender)" : "Vender"}
        </button>
        <button onClick={onResetAll} className="btn" style={btnReset}>Resetar</button>
      </div>

      {/* HISTÓRICO */}
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
                &nbsp;· <em>Motivo: {t.exitReason}</em>
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

/* =========================================
 * STYLES
 * ======================================= */
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
