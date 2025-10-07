// app/robos/page.tsx
"use client";

import React from "react";
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
  const [pair, setPair] = React.useState<(typeof PAIRS)[number]>("BTCUSDT");

  function handlePick(p: (typeof PAIRS)[number]) {
    setPair(p);
    // fallback universal: avisa o componente filho via evento global
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("rc:setPair", { detail: p }));
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-black text-green-400 p-6">
      <h1 className="text-3xl font-bold mb-2 text-center">
        Robôs de Trading (Modo Simulado)
      </h1>
      <p className="text-sm text-green-300 mb-6 text-center max-w-xl">
        Aqui você pode testar estratégias automáticas em tempo real usando dados ao vivo,
        sem arriscar nada. Este é o modo <b>SIM</b> (simulação local).
      </p>

      {/* Seleção rápida de par (as 8 moedas) */}
      <div className="w-full max-w-4xl mb-4">
        <div className="flex flex-wrap gap-2">
          {PAIRS.map((p) => {
            const active = p === pair;
            return (
              <button
                key={p}
                onClick={() => handlePick(p)}
                className={[
                  "px-3 py-2 rounded-lg border text-sm font-semibold",
                  "transition-colors",
                  active
                    ? "bg-emerald-600/30 text-emerald-300 border-emerald-400/50"
                    : "bg-[#0b0b0b] text-green-300/80 border-green-500/30 hover:border-emerald-400/60 hover:text-emerald-300",
                ].join(" ")}
                aria-pressed={active}
              >
                {p.replace("USDT", "/USDT")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Card principal do robô */}
      <div className="w-full max-w-4xl bg-[#0b0b0b] border border-green-500/30 rounded-2xl p-6 shadow-lg">
        {/* 
          Preferência: se o BotRunnerClient aceitar 'pair' ou 'initialPair',
          ele já vai usar a seleção acima. Se ainda não aceitar, ele simplesmente ignora,
          mas receberá também o evento 'rc:setPair' disparado em handlePick().
        */}
        {/* Tenta primeiro 'pair'; se seu componente usa 'initialPair', troque abaixo */}
        <BotRunnerClient pair={pair} />
        {/* <BotRunnerClient initialPair={pair} /> */}
      </div>
    </main>
  );
}
