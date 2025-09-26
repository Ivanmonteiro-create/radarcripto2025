// app/simulador/SimPageClient.tsx  (Client Component)
"use client";

import { useState } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradeControls from "@/components/TradeControls";

export default function SimPageClient() {
  // par inicial (ajuste se quiser outro default)
  const [symbol, setSymbol] = useState<string>("BTCUSDT");

  return (
    <main className="wrapperSingle">
      <section className="panel" style={{ width: "min(1200px,96vw)" }}>
        <div className="compactHeader">
          <h2 className="compactTitle">Simulador</h2>
        </div>

        {/* Grid: gráfico à esquerda, controles à direita (ou abaixo no mobile) */}
        <div className="compactGrid">
          {/* GRÁFICO */}
          <div className="cardMini" style={{ minHeight: 520 }}>
            <TradingViewWidget symbol={symbol} />
          </div>

          {/* CONTROLES */}
          <div className="cardMini">
            {/* AQUI ESTAVA FALTANDO onSymbolChange */}
            <TradeControls
              symbol={symbol}
              onSymbolChange={setSymbol}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
