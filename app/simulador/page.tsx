// app/simulador/page.tsx
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";

// Torna o componente dinâmico tolerante às props (evita erro de tipo no build)
const TVChart = dynamic<any>(
  () => import("@/components/TradingViewWidget").then((m) => m.default ?? m),
  { ssr: false }
);

const PAIRS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "LINKUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
] as const;

export default function SimuladorPage() {
  const [pair, setPair] = useState<(typeof PAIRS)[number]>("BTCUSDT");

  return (
    <div className="rc-sim">
      {/* Cabeçalho */}
      <div className="rc-sim__head">
        <h2 className="rc-sim__title">Controles de Trade</h2>
        <Link href="/" className="rc-btn rc-btn--green">Voltar ao início</Link>
      </div>

      {/* Corpo */}
      <div className="rc-sim__body">
        <div className="rc-sim__chart">
          <TVChart symbol={`BINANCE:${pair}`} interval="30" autosize />
        </div>

        <aside className="rc-sim__side">
          {/* Seção de pares rápida (opcional) */}
          <div className="rc-sim__pairs">
            {PAIRS.map((p) => (
              <button
                key={p}
                className={`rc-pill ${p === pair ? "is-active" : ""}`}
                onClick={() => setPair(p)}
              >
                {p}
              </button>
            ))}
          </div>
          {/* Aqui você pode renderizar seus controles existentes */}
          {/* <TradeControls pair={pair} onPairChange={setPair} /> */}
        </aside>
      </div>

      <style jsx>{`
        .rc-sim { display: grid; gap: 16px; }
        .rc-sim__head { display: flex; align-items: center; justify-content: space-between; }
        .rc-sim__title { font-weight: 700; }
        .rc-sim__body { display: grid; grid-template-columns: minmax(0,1fr) 340px; gap: 16px; }
        .rc-sim__chart { min-height: 70vh; border-radius: 12px; overflow: hidden; }
        .rc-sim__side { display: grid; gap: 12px; align-content: start; }
        .rc-sim__pairs { display: grid; gap: 8px; }
        @media (max-width: 1024px) {
          .rc-sim__body { grid-template-columns: 1fr; }
          .rc-sim__chart { min-height: 60vh; }
        }
      `}</style>
    </div>
  );
}
