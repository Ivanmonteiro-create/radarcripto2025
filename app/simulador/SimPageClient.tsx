"use client";

import { useState } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradeControls from "@/components/TradeControls";

export default function SimPageClient() {
  const [symbol, setSymbol] = useState<string>("BTCUSDT");

  return (
    <main className="wrapperSingle">
      <section className="panel" style={{ width: "min(1200px,96vw)" }}>
        <div className="compactHeader">
          <h2 className="compactTitle">Simulador</h2>
        </div>

        <div className="compactGrid">
          {/* GRÁFICO */}
          <div className="cardMini" style={{ minHeight: 520 }}>
            <TradingViewWidget symbol={symbol} />
          </div>

          {/* CONTROLES */}
          <div className="cardMini">
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
