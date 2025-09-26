'use client';

import { useState } from 'react';
import TradingViewWidget from '@/components/TradingViewWidget';
import TradeControls from '@/components/TradeControls';

export default function SimPageClient() {
  const [symbol, setSymbol] = useState('BINANCE:BTCUSDT');

  return (
    <div className="wrapper">
      <section className="panel" style={{ gridColumn: '1 / span 2', minHeight: 520 }}>
        <TradingViewWidget symbol={symbol} onSymbolChange={setSymbol} />
      </section>

      <section className="panel compactPanel">
        <TradeControls symbol={symbol} onSymbolChange={setSymbol} />
      </section>
    </div>
  );
}
