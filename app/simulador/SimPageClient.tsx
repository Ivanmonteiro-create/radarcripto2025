// app/simulador/SimPageClient.tsx
'use client';

import React, { useRef, useState } from 'react';
import TradingViewWidget from '../../components/TradingViewWidget';
import TradeControls from '../../components/TradeControls';
import { useLivePrice } from '../../lib/priceFeed';

type Pair =
  | 'BTCUSDT'
  | 'ETHUSDT'
  | 'BNBUSDT'
  | 'SOLUSDT'
  | 'ADAUSDT'
  | 'XRPUSDT'
  | 'DOGEUSDT'
  | 'LINKUSDT';

export default function SimPageClient() {
  const [symbol, setSymbol] = useState<Pair>('BTCUSDT');
  const livePrice = useLivePrice(symbol); // pode ser usado dentro do TradeControls depois
  const chartPanelRef = useRef<HTMLDivElement | null>(null);

  return (
    <main className="rc-sim">
      <section className="rc-sim_body">
        <div className="rc-sim_chart" ref={chartPanelRef}>
          <TradingViewWidget symbol={symbol} />
        </div>

        <div className="rc-sim_controls">
          {/* TradeControls requer 'symbol' — passamos a seleção atual */}
          <TradeControls symbol={symbol} />
        </div>
      </section>
    </main>
  );
}
