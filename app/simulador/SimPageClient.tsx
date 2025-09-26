// /app/simulador/SimPageClient.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import TradingViewWidget from '../../components/TradingViewWidget';
import TradeControls from '../../components/TradeControls';
import { useLivePrice } from '../../lib/priceFeed';

type Pair =
  | 'BTCUSDT' | 'ETHUSDT' | 'BNBUSDT' | 'SOLUSDT'
  | 'ADAUSDT' | 'XRPUSDT' | 'DOGEUSDT' | 'DOTUSDT';

export default function SimPageClient() {
  const [symbol, setSymbol] = useState<Pair>('BTCUSDT');
  const livePrice = useLivePrice(symbol);

  // tela cheia do painel do gráfico
  const chartPanelRef = useRef<HTMLDivElement | null>(null);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    const el = chartPanelRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  return (
    <main
      className="wrapper"
      style={{
        // 1fr (gráfico) | 420px (controles)
        gridTemplateColumns: '1fr 420px',
        alignItems: 'stretch',
      }}
    >
      {/* Painel do gráfico */}
      <section className="panel" ref={chartPanelRef} style={{ position: 'relative', minHeight: '78vh' }}>
        <div className="compactHeader" style={{ marginBottom: 8 }}>
          <h2 className="compactTitle" style={{ marginRight: 'auto' }}>
            Gráfico — {symbol}
          </h2>

          {/* Botão de tela cheia: colchetes [ ] */}
          <button
            aria-label="Tela cheia"
            title="Tela cheia"
            onClick={toggleFullscreen}
            className="chartFsBtn--header"
            style={{
              width: 36, height: 36, borderRadius: 10, lineHeight: 1,
              display: 'grid', placeItems: 'center',
              background: 'rgba(255,255,255,.08)',
              border: '1px solid rgba(255,255,255,.18)',
              color: '#e6e6e6', marginRight: 8,
            }}
          >
            {isFs ? '▣' : '▢'}
          </button>

          <a href="/" className="btn tcBackBtn">Voltar ao início</a>
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

      {/* Painel único dos controles */}
      <section className="panel compactPanel">
        <TradeControls
          symbol={symbol}
          onSymbolChange={(s: string) => setSymbol(s as Pair)}
          livePrice={livePrice}
        />
      </section>
    </main>
  );
}
