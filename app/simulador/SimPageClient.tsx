'use client';

import { useState } from 'react';
import TradingViewWidget from '@/components/TradingViewWidget';
import TradeControls from '@/components/TradeControls';

export default function SimPageClient() {
  const [symbol, setSymbol] = useState('BINANCE:BTCUSDT');

  return (
    <div className="wrapper">
      <section className="panel" style={{ gridColumn: '1 / span 2', minHeight: 520 }}>
        {/* ✅ só passa o símbolo, sem onSymbolChange */}
        <TradingViewWidget symbol={symbol} />
      </section>

      <section className="panel compactPanel">
        {/* ✅ aqui sim, os controles podem alterar o símbolo */}
        <TradeControls symbol={symbol} onSymbolChange={setSymbol} />
      </section>
    </div>
  );
}
