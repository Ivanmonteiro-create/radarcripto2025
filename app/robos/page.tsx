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
      <style jsx global>{`
        .rc-backtop,
        .rc-backtop * {
          display: none !important;
        }

        .rc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          padding: 0 20px;
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
          background: #18e273 !important;
          color: #052515 !important;
          box-shadow: 0 0 18px rgba(24, 226, 115, 0.8),
            inset 0 0 10px rgba(24, 226, 115, 0.5);
        }

        .rc-btn--green:hover {
          filter: brightness(1.35);
          transform: translateY(-2px);
          box-shadow: 0 0 28px rgba(24, 226, 115, 1),
            inset 0 0 16px rgba(24, 226, 115, 0.7);
        }

        .page-robos .pill {
          border: 1px solid rgba(24, 226, 115, 0.6) !important;
          background: rgba(24, 226, 115, 0.18) !important;
          color: #dbffef !important;
          font-weight: 800 !important;
          font-size: 17px !important;
          padding: 14px 22px !important;
          border-radius: 999px !important;
          box-shadow: 0 0 14px rgba(24, 226, 115, 0.55) !important;
          transition: transform 150ms ease, box-shadow 150ms ease,
            background 150ms ease, filter 150ms ease !important;
        }

        .page-robos .pill:hover {
          transform: translateY(-1px);
          filter: brightness(1.5);
          box-shadow: 0 0 22px rgba(24, 226, 115, 0.95) !important;
        }

        .page-robos .pill.is-active {
          background: rgba(24, 226, 115, 0.3) !important;
          box-shadow: 0 0 22px rgba(24, 226, 115, 0.95) !important;
        }

        .page-robos .quickpairs {
          margin-top: 18px !important;
          display: flex !important;
          justify-content: center !important;
          flex-wrap: wrap !important;
          gap: 16px !important;
        }

        /* Botão flutuante (Voltar ao início) no canto direito da linha do título */
        .rc-return-btn {
          position: absolute;
          top: 0;
          right: 0;
        }
      `}</style>

      <section className="hero" style={{ position: "relative" }}>
        <h1>
          Robôs de Trading <span>(Modo Simulado)</span>
        </h1>

        {/* Botão verde no canto direito */}
        <a href="/" className="rc-btn rc-btn--green rc-return-btn">
          Voltar ao início
        </a>

        <p className="sub">
          Aqui você pode testar estratégias automatizadas em tempo real usando
          dados ao vivo. Este é o modo SIM (simulação local).
        </p>

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

      <section className="panelWrap">
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
      `}</style>
    </main>
  );
}
