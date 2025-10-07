// components/bots/BotRunnerClient.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { BotConfig } from "@/lib/bots/types";
import { upsertConfig } from "@/lib/bots/store";
import { SimEngine } from "@/lib/bots/simEngine";
import { useLivePrice } from "@/lib/useLivePrice";

// ---- pares permitidos (mesmo conjunto usado nos botões verdes) ----
const ALLOWED_PAIRS = [
  "ADAUSDT",
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "LINKUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "DOGEUSDT",
] as const;
type Pair = typeof ALLOWED_PAIRS[number];
const isPair = (v: string): v is Pair => ALLOWED_PAIRS.includes(v as Pair);

// ---- config padrão do robô (SIM) ----
const DEFAULT: BotConfig = {
  id: "bot-1",
  name: "EMA Cross (SIM)",
  pair: "BTCUSDT",
  mode: "SIM",
  strategy: { kind: "ema-cross", params: { short: 9, long: 21 } },
  risk: { capitalUSDT: 1000, orderSizePct: 10, takeProfitPct: 2, stopLossPct: 1 },
  enabled: false,
  createdAt: Date.now(),
};

export default function BotRunnerClient() {
  const [cfg, setCfg] = useState<BotConfig>(DEFAULT);
  const [running, setRunning] = useState(false);
  const [rt, setRt] = useState<any>(null);

  // engine de simulação
  const engine = useMemo(() => new SimEngine(setRt), []);
  const { price } = useLivePrice(cfg.pair as Pair);

  // persiste alterações
  useEffect(() => {
    upsertConfig(cfg);
  }, [cfg]);

  // escuta cliques nos botões verdes (dispatch feito na página /robos)
  useEffect(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<{ pair?: string }>;
      const next = String(e.detail?.pair ?? "").toUpperCase();
      if (next && isPair(next)) {
        setCfg((c) => ({ ...c, pair: next }));
      }
    };
    window.addEventListener("robot:setPair", handler as EventListener);
    return () => window.removeEventListener("robot:setPair", handler as EventListener);
  }, []);

  // loop simples: dá um step quando tiver preço (suave ~0.8s)
  const lastTs = useRef(0);
  useEffect(() => {
    if (!running || !price) return;
    const now = Date.now();
    if (now - lastTs.current < 800) return;
    lastTs.current = now;
    engine.step(cfg, price, now);
  }, [running, price, engine, cfg]);

  // helpers de input
  const onChangePair = (v: string) => {
    const up = v.toUpperCase();
    // deixa o usuário digitar livre, mas só troca o cfg se ficar válido
    if (isPair(up)) setCfg((c) => ({ ...c, pair: up }));
  };

  return (
    <div className="panel" style={{ padding: 12 }}>
      <div className="compactHeader">
        <div className="compactTitle">Robô (SIM) — {cfg.name}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setRunning((v) => !v)}>
            {running ? "Parar" : "Iniciar"}
          </button>
          <button
            className="btn"
            onClick={() => setCfg((c) => ({ ...c, enabled: !c.enabled }))}
          >
            {cfg.enabled ? "Desabilitar" : "Habilitar"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <label className="lbl">
            Par
            <input
              className="inp"
              value={cfg.pair}
              onChange={(e) => onChangePair(e.target.value)}
              placeholder="ex.: BTCUSDT"
            />
          </label>

          <label className="lbl">
            Capital (USDT)
            <input
              className="inp"
              type="number"
              value={cfg.risk.capitalUSDT}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  risk: { ...c.risk, capitalUSDT: Number(e.target.value) || 0 },
                }))
              }
            />
          </label>

          <label className="lbl">
            % por trade
            <input
              className="inp"
              type="number"
              value={cfg.risk.orderSizePct}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  risk: { ...c.risk, orderSizePct: Number(e.target.value) || 0 },
                }))
              }
            />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          <label className="lbl">
            EMA curta
            <input
              className="inp"
              type="number"
              value={(cfg.strategy.params as any).short as number}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  strategy: {
                    ...c.strategy,
                    params: { ...(c.strategy.params as any), short: Number(e.target.value) || 0 },
                  },
                }))
              }
            />
          </label>

          <label className="lbl">
            EMA longa
            <input
              className="inp"
              type="number"
              value={(cfg.strategy.params as any).long as number}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  strategy: {
                    ...c.strategy,
                    params: { ...(c.strategy.params as any), long: Number(e.target.value) || 0 },
                  },
                }))
              }
            />
          </label>

          <label className="lbl">
            TP (%)
            <input
              className="inp"
              type="number"
              value={cfg.risk.takeProfitPct ?? 0}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  risk: { ...c.risk, takeProfitPct: Number(e.target.value) || 0 },
                }))
              }
            />
          </label>

          <label className="lbl">
            SL (%)
            <input
              className="inp"
              type="number"
              value={cfg.risk.stopLossPct ?? 0}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  risk: { ...c.risk, stopLossPct: Number(e.target.value) || 0 },
                }))
              }
            />
          </label>
        </div>

        <div
          className="highlight"
          style={{
            padding: 10,
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 8,
          }}
        >
          <div>
            <small className="muted">Preço</small>
            <div className="bold">
              {price ? price.toLocaleString("pt-PT") : "—"}
            </div>
          </div>

          <div>
            <small className="muted">Equity</small>
            <div className="bold">
              {rt?.equityUSDT !== undefined ? rt.equityUSDT.toFixed(2) : "—"}
            </div>
          </div>

          <div>
            <small className="muted">PnL</small>
            <div className={rt?.pnlUSDT >= 0 ? "pnlPos" : "pnlNeg"}>
              {rt?.pnlUSDT !== undefined ? rt.pnlUSDT.toFixed(2) : "—"}
            </div>
          </div>

          <div>
            <small className="muted">Aberta</small>
            <div>
              {rt?.openPos
                ? `${rt.openPos.side} @ ${rt.openPos.entryPrice.toFixed(2)}`
                : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
