"use client";

import React, { useState } from "react";
import TradingViewWidget from "@components/TradingViewWidget";
import TradeControls from "@components/TradeControls";

type Pair =
  | "BTCUSDT"
  | "ETHUSDT"
  | "BNBUSDT"
  | "SOLUSDT"
  | "ADAUSDT"
  | "XRPUSDT"
  | "DOGEUSDT"
  | "LINKUSDT";

export default function SimPageClient() {
  const [symbol, setSymbol] = useState<Pair>("BTCUSDT");

  return (
    <main className="wrapperSingle">
      <section className="panel compactPanel tradePanelShell">
        <div className="compactGrid">
          {/* Coluna A: gráfico */}
          <div className="colA">
            <div style={{ height: 520, minHeight: 520 }}>
              {/* <<<  AQUI: apenas symbol, sem interval/theme/autosize  >>> */}
              <TradingViewWidget symbol={symbol} />
            </div>
          </div>

          {/* Coluna B: controles */}
          <div className="colB">
            <TradeControls
              symbol={symbol}
              onSymbolChange={(s: string) => setSymbol(s as Pair)}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
