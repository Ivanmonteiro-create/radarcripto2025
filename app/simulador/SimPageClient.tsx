// app/simulador/SimPageClient.tsx
"use client";

import React, { useState } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradeControls from "@/components/TradeControls"; // já existente no seu projeto
import Link from "next/link";

type Props = {
  initialSymbol?: string;
};

export default function SimPageClient({ initialSymbol = "BTCUSDT" }: Props) {
  const [symbol, setSymbol] = useState(initialSymbol);

  return (
    <main className="wrapper" style={{ gridTemplateColumns: "1fr 360px", gap: 16 }}>
      {/* Coluna do gráfico (ocupa bem a tela, como antes) */}
      <section className="panel" style={{ minHeight: "calc(100dvh - 32px)" }}>
        <div style={{ position: "relative", height: "100%" }}>
          {/* Botão Tela Cheia (presente visualmente; acople ao seu handler se desejar) */}
          <button
            className="chartFsBtn chartFsBtn--header"
            title="Tela cheia"
            aria-label="Tela cheia"
            style={{ position: "absolute", top: 8, right: 8, zIndex: 5 }}
            onClick={() => {
              // opcional: implementar fullscreen real do container
              const el = document.documentElement;
              if (el.requestFullscreen) el.requestFullscreen();
            }}
          >
            ⛶
          </button>

          <TradingViewWidget symbol={symbol} interval="1" theme="dark" autosize />
        </div>
      </section>

      {/* Coluna do painel de controles (compacto) */}
      <aside className="panel compactPanel compactRoot" style={{ position: "relative" }}>
        <header className="compactHeader tcHeader">
          <h2 className="compactTitle tcTitle">Controles de Trade</h2>
          <div className="tcHeaderActions">
            <Link href="/" className="btn tcBackBtn">Voltar ao início</Link>
          </div>
        </header>

        {/* Importante: passar symbol e onSymbolChange (evita o erro de prop ausente) */}
        <TradeControls symbol={symbol} onSymbolChange={setSymbol} />
      </aside>
    </main>
  );
}
