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

  // Atualiza o campo “Par” dentro do BotRunnerClient (id="robotPair")
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
      <section className="hero">
        <h1>
          Robôs de Trading <span>(Modo Simulado)</span>
        </h1>
        <p className="sub">
          Aqui você pode testar estratégias automatizadas em tempo real usando
          dados ao vivo. Este é o modo SIM (simulação local).
        </p>

        {/* Moedas / chips centralizados */}
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

      {/* Painel centralizado */}
      <section className="panelWrap">
        {/* Botão verde à direita */}
        <div className="backBtnInPanel">
          <a href="/" className="rc-btn rc-btn--green">Voltar ao início</a>
        </div>

        {/* Robô funcional */}
        <BotRunnerClient pair={active} onPairChange={setActive} />
      </section>

      <style jsx>{`
        .page-robos {
          --panel-w: min(1240px, 92vw);
          --panel-pad: clamp(12px, 1.8vw, 20px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 24px 0 64px;
        }

        .hero {
          width: var(--panel-w);
          text-align: center;
        }
        .hero h1 {
          font-size: clamp(28px, 3.6vw, 44px);
          line-height: 1.05;
          margin: 0 0 6px 0;
          font-weight: 900;
          letter-spacing: 0.2px;
        }
        .hero h1 span {
          color: #18e273;
          text-shadow: 0 0 10px rgba(24, 226, 115, 0.8);
        }
        .hero .sub {
          margin: 0 auto;
          max-width: 900px;
          opacity: 0.9;
        }

        .quickpairs {
          margin-top: 16px;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .pill {
          border: 1px solid rgba(24, 226, 115, 0.35);
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(24, 226, 115, 0.08);
          color: #cfe;
          font-weight: 700;
          transition: transform 120ms ease, box-shadow 120ms ease,
            background 120ms ease, filter 120ms ease;
        }
        .pill:hover {
          transform: translateY(-1px);
          filter: brightness(1.5);
          box-shadow: 0 0 10px rgba(24, 226, 115, 0.6);
        }
        .pill.is-active {
          background: rgba(24, 226, 115, 0.22);
          box-shadow: 0 0 10px rgba(24, 226, 115, 0.6);
        }

        .panelWrap {
          position: relative;
          width: var(--panel-w);
          padding: var(--panel-pad);
          border-radius: 18px;
          box-shadow: inset 0 0 0 1px rgba(24, 226, 115, 0.18),
            0 20px 60px rgba(0, 0, 0, 0.35);
          background: linear-gradient(
            180deg,
            rgba(8, 24, 16, 0.55) 0%,
            rgba(6, 18, 12, 0.45) 100%
          );
        }

        .backBtnInPanel {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 5;
        }

        /* Botão verde fluorescente */
        .rc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 36px;
          padding: 0 18px;
          border-radius: 10px;
          font-weight: 800;
          text-decoration: none;
          line-height: 1;
          white-space: nowrap;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .rc-btn--green {
          background: #18e273;
          color: #052515;
          box-shadow: 0 0 15px rgba(24, 226, 115, 0.7),
            inset 0 0 10px rgba(24, 226, 115, 0.4);
        }
        .rc-btn--green:hover {
          filter: brightness(1.3);
          transform: translateY(-2px);
          box-shadow: 0 0 25px rgba(24, 226, 115, 0.9),
            inset 0 0 14px rgba(24, 226, 115, 0.5);
        }

        @media (max-width: 720px) {
          .rc-btn {
            height: 32px;
            padding: 0 14px;
          }
          .backBtnInPanel {
            top: 10px;
            right: 10px;
          }
        }
      `}</style>
    </main>
  );
}
