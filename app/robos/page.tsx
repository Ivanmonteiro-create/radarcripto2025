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
  // Só para os chips preencherem o campo "Par" dentro do BotRunnerClient (id="robotPair")
  function setRobotPair(pair: string) {
    const el = document.getElementById("robotPair") as
      | HTMLInputElement
      | HTMLSelectElement
      | null;
    if (!el) return;
    el.value = pair;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // rolar para o topo ao abrir
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [active, setActive] = useState<string>("BTCUSDT");

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

      {/* Painel do robô ampliado e centralizado */}
      <section className="panelWrap">
        {/* Botão verde no lado direito do painel */}
        <div className="backBtnInPanel">
          <a href="/" className="rc-btn rc-btn--green">Voltar ao início</a>
        </div>

        {/* Componente do robô (sem alterações internas) */}
        <BotRunnerClient />
      </section>

      <style jsx>{`
        /* Layout da página */
        .page-robos {
          --panel-w: min(1240px, 92vw); /* MAIS LARGO */
          --panel-pad: clamp(12px, 1.8vw, 20px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 24px 0 64px;
        }

        /* Título/descrição centralizados */
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
          color: #18e273; /* verde da marca */
        }
        .hero .sub {
          margin: 0 auto;
          max-width: 900px;
          opacity: 0.9;
        }

        /* Chips centralizados */
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
            background 120ms ease;
        }
        .pill:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 0 1px rgba(24, 226, 115, 0.3),
            0 8px 24px rgba(0, 0, 0, 0.35);
        }
        .pill.is-active {
          background: rgba(24, 226, 115, 0.22);
          box-shadow: 0 0 0 1px rgba(24, 226, 115, 0.55);
        }

        /* Painel central ampliado */
        .panelWrap {
          position: relative;
          width: var(--panel-w);
          padding: var(--panel-pad);
          border-radius: 18px;
          /* leve brilho verde ao redor para combinar com o resto do site */
          box-shadow: inset 0 0 0 1px rgba(24, 226, 115, 0.18),
            0 20px 60px rgba(0, 0, 0, 0.35);
          background: linear-gradient(
            180deg,
            rgba(8, 24, 16, 0.55) 0%,
            rgba(6, 18, 12, 0.45) 100%
          );
        }

        /* Botão verde dentro do painel, alinhado à direita */
        .backBtnInPanel {
          position: absolute;
          top: 14px; /* alinhar com cabeçalho do formulário */
          right: 14px;
          z-index: 5;
          display: inline-flex;
        }

        /* Botão padrão verde do projeto (mesmo visual das outras telas) */
        .rc-btn {
          display: inline-flex;
          align-items: center;
          height: 34px;
          padding: 0 14px;
          border-radius: 8px;
          font-weight: 800;
          text-decoration: none;
          line-height: 1;
          white-space: nowrap;
          border: 0;
          cursor: pointer;
        }
        .rc-btn--green {
          background: #18e273; /* cor principal RadarCrypto */
          color: #052515;
          box-shadow: 0 0 0 1px rgba(0, 255, 128, 0.28),
            0 8px 24px rgba(0, 0, 0, 0.35);
        }
        .rc-btn--green:hover {
          filter: brightness(1.07);
          transform: translateY(-1px);
        }

        /* Ajuste de respiro no mobile */
        @media (max-width: 720px) {
          .backBtnInPanel {
            top: 10px;
            right: 10px;
          }
          .rc-btn {
            height: 32px;
            padding: 0 12px;
          }
        }
      `}</style>
    </main>
  );
}
