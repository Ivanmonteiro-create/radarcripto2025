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

  // Tela cheia do painel do GRÁFICO
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
      // controles mais estreitos para caber em 100% zoom
      style={{ gridTemplateColumns: '1fr 400px', alignItems: 'stretch' }}
    >
      {/* ------- Painel do GRÁFICO ------- */}
      <section className="panel" ref={chartPanelRef} style={{ position: 'relative', minHeight: '78vh' }}>
        {/* Cabeçalho simples do gráfico */}
        <div className="compactHeader" style={{ marginBottom: 8 }}>
          <h2 className="compactTitle" style={{ margin: 0 }}>Gráfico — {symbol}</h2>
        </div>

        {/* Botão TELA CHEIA no topo direito do painel do gráfico (acima da “câmera”) */}
        <button
          aria-label="Tela cheia"
          title="Tela cheia"
          onClick={toggleFullscreen}
          style={{
            position: 'absolute',
            top: 4,
            right: 44,         // ~1cm da “câmera” do TV
            zIndex: 5,
            width: 28,
            height: 28,
            borderRadius: 8,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(255,255,255,.12)',
            color: '#e6e6e6',
            border: '1px solid rgba(255,255,255,.25)',
            cursor: 'pointer'
          }}
        >
          {isFs ? '▣' : '▢'}
        </button>

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

      {/* ------- Painel CONTROLES ------- */}
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
