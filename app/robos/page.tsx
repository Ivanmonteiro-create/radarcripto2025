// app/robos/page.tsx
"use client";

import React, { useEffect } from "react";
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
  // Atualiza o campo “Par” automaticamente quando o usuário clica em uma moeda
  function setRobotPair(pair: string) {
    const el = document.getElementById("robotPair") as
      | HTMLInputElement
      | HTMLSelectElement
      | null;

    if (!el) return;
    el.value = pair;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Scroll para o topo (boa prática visual ao abrir a página)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="rc-page">
      <section className="rc-section">
        <h1 className="rc-title">
          Robôs de Trading <span className="rc-green">(Modo Simulado)</span>
        </h1>
        <p className="rc-desc">
          Aqui você pode testar estratégias automatizadas em tempo real usando dados ao vivo.
          Este é o modo SIM (simulação local).
        </p>

        {/* Seleção rápida de pares */}
        <div className="rc-quickpairs">
          {PAIRS.map((p) => (
            <button
              key={p}
              type="button"
              className="rc-pill"
              onClick={() => setRobotPair(p)}
              aria-label={`Selecionar par ${p}`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Bot principal do robô */}
        <div className="rc-botcontainer">
          <BotRunnerClient />
        </div>

        {/* Botão voltar ao início */}
        <div className="rc-backtop">
          <a href="/" className="rc-btn rc-btn--green">
            Voltar ao início
          </a>
        </div>
      </section>
    </div>
  );
}
