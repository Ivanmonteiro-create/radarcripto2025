// app/simulador/SimPageClient.tsx
"use client";

import { useState, useMemo } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradeControls from "@/components/TradeControls";

type Pair = "BTCUSDT" | "ETHUSDT" | "BNBUSDT";

export default function SimPageClient() {
  // Par inicial (como era no projeto)
  const [symbol, setSymbol] = useState<Pair>("BTCUSDT");

  // Altura do gráfico confortável
  const chartHeight = useMemo(() => 520, []);

  return (
    <div className="panel tradePanelShell compactPanel" style={{ position: "relative" }}>
      {/* GRID 2 colunas: gráfico grande | controles */}
      <div className="compactGrid" style={{ gridTemplateColumns: "minmax(560px,1fr) 380px" }}>
        {/* Coluna A — Gráfico */}
        <div className="cardMini" style={{ minWidth: 0 }}>
          <div className="tcHeader">
            <h2 className="tcTitle">Gráfico — {symbol}</h2>
            {/* Botão Tela Cheia clássico (colado no cabeçalho) */}
            <button
              className="chartFsBtn--header"
              aria-label="Tela cheia"
              title="Tela cheia"
              onClick={() => {
                const host = document.getElementById("tv-host");
                if (!host) return;
                if (!document.fullscreenElement) {
                  host.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
            >
              ⛶
            </button>
          </div>

          <div id="tv-host" className="panel" style={{ padding: 10 }}>
            <TradingViewWidget symbol={symbol} interval="1" theme="dark" height={chartHeight} />
          </div>
        </div>

        {/* Coluna B — Controles */}
        <div className="cardMini" style={{ minWidth: 0 }}>
          <TradeControls symbol={symbol} onSymbolChange={(s) => setSymbol(s as Pair)} />
        </div>
      </div>
    </div>
  );
}
