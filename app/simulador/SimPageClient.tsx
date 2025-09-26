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

  // Tela cheia (aplicada ao painel do gráfico)
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
      // Painel de controles um pouco mais largo
      style={{ gridTemplateColumns: '1fr 480px', alignItems: 'stretch' }}
    >
      {/* Painel do gráfico */}
      <section className="panel" ref={chartPanelRef} style={{ position: 'relative', minHeight: '78vh' }}>
        <div className="compactHeader" style={{ marginBottom: 8 }}>
          <h2 className="compactTitle" style={{ marginRight: 'auto' }}>
            Gráfico — {symbol}
          </h2>
          {/* (REMOVIDO) Tela cheia aqui; agora o botão fica no painel de controles */}
        </div>

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

      {/* Painel único de controles — recebe o toggleFullscreen pra exibir o botão no topo direito */}
      <section className="panel compactPanel">
        <TradeControls
          symbol={symbol}
          onSymbolChange={(s: string) => setSymbol(s as Pair)}
          livePrice={livePrice}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFs}
        />
      </section>
    </main>
  );
}
