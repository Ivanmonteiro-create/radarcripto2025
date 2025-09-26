"use client";

import { useState } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import TradeControls from "@/components/TradeControls";

export default function SimPageClient() {
  const [symbol, setSymbol] = useState("BTCUSDT");

  return (
    <main className="simShell">
      <section className="panel chartBox">
        <div className="chartWrap">
          <TradingViewWidget symbol={symbol} />
        </div>
      </section>

      <section className="panel compactPanel">
        <div className="tcHeader">
          <h2 className="compactTitle">Controles de Trade</h2>
          <a href="/" className="btn tcBackBtn">Voltar ao início</a>
        </div>

        <div className="tradePanelShell">
          <TradeControls symbol={symbol} />
        </div>
      </section>
    </main>
  );
}
