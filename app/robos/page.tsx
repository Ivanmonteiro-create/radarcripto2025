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
  const [active, setActive] = useState<string>("BTCUSDT");

  // Atualiza o select do BotRunnerClient (id="robotPair")
  function setRobotPair(pair: string) {
    const el = document.getElementById("robotPair") as
      | HTMLInputElement
      | HTMLSelectElement
      | null;
    if (!el) return;
    el.value = pair;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="page-robos">
      {/* HEADER / HERO */}
      <section className="hero">
        {/* NOVO: botão no canto superior direito */}
        <a href="/" className="rc-btn rc-btn--green hero__back">
          Voltar ao início
        </a>

        <h1>
          Robôs de Trading <span>(Modo Simulado)</span>
        </h1>
        <p className="sub">
          Aqui você pode testar estratégias automatizadas em tempo real usando
          dados ao vivo. Este é o modo SIM (simulação local).
        </p>

        {/* Chips das moedas */}
        <div className="quickpairs" role="group" aria-label="Atalhos de pares">
          {PAIRS.map((p) => (
            <button
              key={p}
              type="button"
              className={`pill ${active === p ? "is-active" : ""}`}
              onClick={() => {
                setActive(p);
                setRobotPair(p);
              }}
              aria-pressed={active === p}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* PAINEL DO ROBÔ */}
      <section className="panelWrap">
        <BotRunnerClient pair={active} onPairChange={setActive} />
      </section>

      {/* CSS local mínimo (apenas posicionamento do botão) */}
      <style jsx>{`
        .hero {
          position: relative; /* referência para o botão absoluto */
        }
        .hero__back {
          position: absolute;
          top: 0;
          right: 0;
          z-index: 10;
        }
        @media (min-width: 640px) {
          .hero__back {
            transform: translateY(4px); /* pequeno ajuste de alinhamento */
          }
        }
        @media (max-width: 720px) {
          .hero__back {
            right: 8px;
            top: 2px;
          }
        }
      `}</style>
    </main>
  );
}
