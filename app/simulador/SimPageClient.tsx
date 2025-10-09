// app/simulador/SimPageClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import TradingViewWidget from "../../components/TradingViewWidget";
import TradeControls from "../../components/TradeControls";
import { useLivePrice } from "../../lib/priceFeed";

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
  const livePrice = useLivePrice(symbol);
  const chartPanelRef = useRef<HTMLDivElement | null>(null);
  const [isFs, setIsFs] = useState(false);

  return (
    <main className="page-simulador">
      <div ref={chartPanelRef}>
        <TradingViewWidget symbol={symbol} />
      </div>

      {/* Painel de controles */}
      <section className="rc-controls">
        {/* Botão dentro e à frente do painel */}
        <div className="rc-backtop">
          <a href="/" className="rc-btn">
            Voltar ao início
          </a>
        </div>

        <TradeControls />
        />
      </section>
    </main>
  );
}
