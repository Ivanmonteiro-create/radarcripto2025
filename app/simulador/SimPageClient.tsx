// /app/simulador/SimPageClient.tsx
'use client';

import { useState } from 'react';
import TradingViewWidget from '../../components/TradingViewWidget';
import TradeControls from '../../components/TradeControls';
import { useLivePrice } from '../../lib/priceFeed';

type Pair = 'BTCUSDT' | 'ETHUSDT' | 'BNBUSDT';

export default function SimPageClient() {
  const [symbol, setSymbol] = useState<Pair>('BTCUSDT');
  const livePrice = useLivePrice(symbol);

  return (
    <main className="wrapper" style={{ gridTemplateColumns: '1fr 420px' }}>
      {/* Painel do gráfico */}
      <section className="panel" style={{ minHeight: '78vh' }}>
        <div className="compactHeader" style={{ marginBottom: 8 }}>
          <h2 className="compactTitle">Gráfico — {symbol}</h2>
        </div>

        {/* TradingView */}
        <div style={{ height: '72vh', minHeight: 520 }}>
          <TradingViewWidget
            symbol={symbol}
            interval="1"
            theme="dark"
            autosize
            height={undefined}
          />
        </div>
      </section>

      {/* Painel dos controles */}
      <section className="panel compactPanel">
        <div className="compactHeader">
          <h3 className="compactTitle">Controles de Trade</h3>
          <a href="/" className="btn tcBackBtn">Voltar ao início</a>
        </div>

        <TradeControls
          symbol={symbol}
          onSymbolChange={(s: string) => setSymbol(s as Pair)}
          livePrice={livePrice}
        />
      </section>
    </main>
  );
}
