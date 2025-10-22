// app/robos/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import BotRunnerClient from "@/components/bots/BotRunnerClient";

const PAIRS = [
  "ADAUSDT",
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "LINKUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "DOGEUSDT",
] as const;

export default function RobosPage() {
  const [pair, setPair] = useState<string>("BTCUSDT");

  // Leva para o topo ao abrir
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Altera o <select id="robotPair"> dentro do formulário do robô (quando existir)
  const onQuickPick = (p: string) => {
    setPair(p);
    const el = document.getElementById("robotPair") as
      | HTMLInputElement
      | HTMLSelectElement
      | null;
    if (el) {
      el.value = p;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  return (
    <main className="page-robos rc-page">
      <section className="rc-section" style={{ paddingTop: 12 }}>
        {/* Cabeçalho + botão verde “Voltar ao início” à direita */}
        <header
          className="rc-robosHeader"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <h1 className="rc-title">
              Robôs de Trading <span className="rc-green">(Modo Simulado)</span>
            </h1>
            <p className="rc-desc" style={{ opacity: 0.9 }}>
              Aqui você pode testar estratégias automatizadas em tempo real usando dados ao vivo.
              Este é o modo SIM (simulação local).
            </p>
          </div>

          <a href="/" className="rc-btn rc-btn--green">Voltar ao início</a>
        </header>

        {/* Seleção rápida de pares (centralizada) */}
        <div
          className="rc-quickpairs"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
            margin: "8px 0 16px",
          }}
        >
          {PAIRS.map((p) => (
            <button
              key={p}
              type="button"
              className={`rc-pill ${pair === p ? "is-active" : ""}`}
              onClick={() => onQuickPick(p)}
              aria-pressed={pair === p}
              aria-label={`Selecionar par ${p}`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Container do robô (mantém seu componente e estado de par) */}
        <div className="rc-botcontainer">
          <BotRunnerClient pair={pair} onPairChange={setPair} />
        </div>
      </section>
    </main>
  );
}
