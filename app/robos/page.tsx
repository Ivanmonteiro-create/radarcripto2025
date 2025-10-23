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

  // Atualiza o select do BotRunnerClient pelo id="robotPair"
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
      {/* --- OVERRIDES GLOBAIS PARA ESTA PÁGINA --- */}
      <style jsx global>{`
        /* Esconde a faixa preta antiga e qualquer "Voltar ao início" superior */
        .page-robos .rc-backtop,
        .page-robos .rc-backtop * {
          display: none !important;
        }

        /* Padrão do botão verde fluorescente (mesmo das demais telas) */
        .page-robos .rc-btn {
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
        .page-robos .rc-btn--green {
          background: #18e273;
          color: #052515;
          box-shadow: 0 0 16px rgba(24, 226, 115, 0.75),
            inset 0 0 10px rgba(24, 226, 115, 0.45);
        }
        .page-robos .rc-btn--green:hover {
          filter: brightness(1.28);
          transform: translateY(-2px);
          box-shadow: 0 0 26px rgba(24, 226, 115, 0.95),
            inset 0 0 14px rgba(24, 226, 115, 0.55);
        }

        /* Chips mais fluorescentes (verde forte + brilho) */
        .page-robos .pill {
          border: 1px solid rgba(24, 226, 115, 0.55) !important;
          background: rgba(24, 226, 115, 0.16) !important;
          color: #dbffef !important;
          font-weight: 800 !important;
          box-shadow: 0 0 12px rgba(24, 226, 115, 0.5) !important;
          transition: transform 120ms ease, box-shadow 120ms ease,
            background 120ms ease, filter 120ms ease !important;
        }
        .page-robos .pill:hover {
          transform: translateY(-1px);
          filter: brightness(1.45);
          box-shadow: 0 0 18px rgba(24, 226, 115, 0.9) !important;
        }
        .page-robos .pill.is-active {
          background: rgba(24, 226, 115, 0.28) !important;
          box-shadow: 0 0 18px rgba(24, 226, 115, 0.9) !important;
        }
      `}</style>

      {/* Cabeçalho / descrição centralizados */}
      <section className="hero">
        <h1>
          Robôs de Trading <span>(Modo Simulado)</span>
        </h1>
        <p className="sub">
          Aqui você pode testar estratégias automatizadas em tempo real usando
          dados ao vivo. Este é o modo SIM (simulação local).
        </p>

        {/* Atalhos de pares */}
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

      {/* Painel central com botão à direita */}
      <section className="panelWrap">
        <div className="backBtnInPanel">
          <a href="/" className="rc-btn rc-btn--green">Voltar ao início</a>
        </div>

        <BotRunnerClient pair={active} onPairChange={setActive} />
      </section>

      {/* Estilos locais do layout desta página */}
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

        /* Botão verde fica fixo no canto superior direito do painel */
        .backBtnInPanel {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 5;
        }

        @media (max-width: 720px) {
          .backBtnInPanel {
            top: 10px;
            right: 10px;
          }
        }
      `}</style>
    </main>
  );
}
