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

  // adiciona/Remove uma classe no <body> para podermos aplicar CSS global só nesta rota
  useEffect(() => {
    document.body.classList.add("page-robos-active");
    // rolar para topo ao abrir
    window.scrollTo(0, 0);
    return () => {
      document.body.classList.remove("page-robos-active");
    };
  }, []);

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

      {/* CSS — parte GLOBAL (alvo: tarja preta geral do site; só nesta rota) */}
      <style jsx global>{`
        /* Esconde a tarja/backtop universal somente quando estamos em /robos */
        body.page-robos-active .rc-backtop,
        body.page-robos-active .rc-backtop::before,
        body.page-robos-active .rc-backtop::after {
          display: none !important;
        }
      `}</style>

      {/* CSS — escopado da página */}
      <style jsx>{`
        .robosHeader {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 12px;
          margin: 8px auto 12px;
          max-width: 1240px;
          width: min(1240px, 98vw);
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
          max-width: 1240px;
          width: min(1240px, 98vw);
        }
        /* chips maiores e legíveis */
        :global(.rc-pill.rc-pill--big) {
          height: 42px;
          padding: 0 16px;
          font-size: 14.5px;
          border-radius: 999px;
        }

        /* Wrapper mais largo; força o filho a expandir 100%,
           mesmo se o componente tiver max-width interno */
        .botWrap {
          margin: 0 auto 22px;
          max-width: 1240px;
          width: min(1240px, 98vw);
        }
        .botWrap :global(> *),
        .botWrap :global(> div),
        .botWrap :global(> section) {
          width: 100% !important;
          max-width: 100% !important;
        }
        /* casos comuns de containers internos (se existirem) */
        .botWrap :global(.rc-panel),
        .botWrap :global(.rc-card),
        .botWrap :global(.rc-form),
        .botWrap :global(.rc-botpanel) {
          width: 100% !important;
          max-width: 100% !important;
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
