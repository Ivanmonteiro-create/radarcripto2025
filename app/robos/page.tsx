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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ao clicar no chip, atualiza o estado e (se existir) o <select id="robotPair">
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
      <section className="rc-section">
        {/* Cabeçalho + botão verde à direita */}
        <header className="robosHeader">
          <div className="robosHeadText">
            <h1 className="rc-title">
              Robôs de Trading <span className="rc-green">(Modo Simulado)</span>
            </h1>
            <p className="rc-desc">
              Aqui você pode testar estratégias automatizadas em tempo real usando dados ao vivo.
              Este é o modo SIM (simulação local).
            </p>
          </div>

          <a href="/" className="rc-btn rc-btn--green">Voltar ao início</a>
        </header>

        {/* Chips centralizados e maiores */}
        <div className="quickpairs">
          {PAIRS.map((p) => (
            <button
              key={p}
              type="button"
              className={`rc-pill rc-pill--big ${pair === p ? "is-active" : ""}`}
              onClick={() => onQuickPick(p)}
              aria-pressed={pair === p}
              aria-label={`Selecionar par ${p}`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Card do robô — mais largo/alto e centralizado */}
        <div className="botWrap">
          <BotRunnerClient pair={pair} onPairChange={setPair} />
        </div>
      </section>

      {/* CSS escopado só desta página */}
      <style jsx>{`
        /* Esconde QUALQUER tarja/linha/backtop herdado no topo desta página */
        .page-robos :global(.rc-backtop),
        .page-robos :global(.rc-page-top),
        .page-robos :global(.rc-topband),
        .page-robos :global(.rc-topstrip) {
          display: none !important;
        }

        .robosHeader {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 12px;
          margin: 8px auto 12px;
          max-width: 1200px;
          width: min(1200px, 96vw);
        }
        .robosHeadText :global(.rc-title) {
          margin: 0 0 4px 0;
        }
        .robosHeadText :global(.rc-desc) {
          margin: 0;
          opacity: .92;
        }

        .quickpairs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin: 10px auto 18px;
          max-width: 1200px;
          width: min(1200px, 96vw);
        }
        /* chips maiores e legíveis */
        :global(.rc-pill.rc-pill--big) {
          height: 42px;
          padding: 0 16px;
          font-size: 14.5px;
          border-radius: 999px;
        }

        /* container do robô mais robusto e centralizado */
        .botWrap {
          margin: 0 auto 22px;
          width: min(1240px, 98vw);
          /* respiro extra ao conteúdo interno do card existente */
          padding-inline: 6px;
        }

        @media (max-width: 980px) {
          .robosHeader {
            grid-template-columns: 1fr;
            justify-items: center;
            text-align: center;
          }
          .robosHeader :global(.rc-btn--green) {
            margin-top: 8px;
          }
        }
      `}</style>
    </main>
  );
}
