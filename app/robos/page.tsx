// app/robos/page.tsx
"use client";

import React, { useState } from "react";
import BotRunnerClient from "@/components/bots/BotRunnerClient";

const PAIRS = [
  "ADAUSDT","BTCUSDT","ETHUSDT","SOLUSDT",
  "LINKUSDT","BNBUSDT","XRPUSDT","DOGEUSDT",
] as const;

export default function RobosPage() {
  const [pair, setPair] = useState<string>("BTCUSDT");

  return (
    <section className="container" style={{ paddingTop: 24 }}>
      <header style={{ marginBottom: 16 }}>
        <h1 className="rc-h2">Robôs de Trading (Modo Simulado)</h1>
        <p className="rc-muted">
          Aqui você pode testar estratégias automatizadas em tempo real usando dados ao vivo.
          Este é o modo SIM (simulação local).
        </p>
      </header>

      {/* CHIPS das 8 moedas */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {PAIRS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPair(p)}
            className={`rc-pill ${pair === p ? "is-active" : ""}`}
            aria-pressed={pair === p}
          >
            {p}
          </button>
        ))}
      </div>

      {/* BotRunner recebe e controla o mesmo estado */}
      <BotRunnerClient pair={pair} onPairChange={setPair} />
    </section>
  );
}
