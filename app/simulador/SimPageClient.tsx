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

  // -------- Tela cheia do painel do GRÁFICO --------
  const chartPanelRef = useRef<HTMLDivElement | null>(null);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const enterFs = () => {
    const el = chartPanelRef.current;
    if (!el || document.fullscreenElement) return;
    void el.requestFullscreen();
  };
  const exitFs = () => { if (document.fullscreenElement) void document.exitFullscreen(); };
  const toggleFs = () => (document.fullscreenElement ? exitFs() : enterFs());

  // atalhos: F entra, X sai
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') { e.preventDefault(); enterFs(); }
      if (e.key.toLowerCase() === 'x') { e.preventDefault(); exitFs(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <main
      className="wrapper"
      style={{ gridTemplateColumns: '1fr 360px', alignItems: 'stretch' }}
    >
      {/* --------- GRÁFICO --------- */}
      <section
        ref={chartPanelRef}
        className="panel"
        style={{
          position: 'relative',
          minHeight: '78vh',
          // quando em fullscreen, o próprio elemento vira viewport
          // e o conteúdo ocupa 100%
        }}
      >
        {/* Cabeçalho do painel (escondido em FS para liberar área) */}
        {!isFs && (
          <div className="compactHeader" style={{ marginBottom: 8 }}>
            <h2 className="compactTitle" style={{ margin: 0 }}>Gráfico — {symbol}</h2>
          </div>
        )}

        {/* Botão de Tela Cheia — alinhado acima da “câmera” */}
        <button
          aria-label="Tela cheia"
          title="Tela cheia"
          onClick={toggleFs}
          style={{
            position: 'absolute',
            top: 4,
            right: 44,          // ~1 cm da “câmera”
            zIndex: 6,
            width: 28, height: 28, borderRadius: 8,
            display: 'grid', placeItems: 'center',
            background: 'rgba(255,255,255,.12)',
            color: '#e6e6e6',
            border: '1px solid rgba(255,255,255,.25)',
            cursor: 'pointer'
          }}
        >
          {isFs ? '✕' : '▢'}
        </button>

        <div
          // em FS, o contêiner vai a 100% da altura do elemento full
          style={{ height: isFs ? '100vh' : '72vh', minHeight: 520 }}
        >
          <TradingViewWidget
            symbol={symbol}
            interval="1"
            theme="dark"
            autosize
            height={undefined}
          />
        </div>
      </section>

      {/* --------- CONTROLES --------- */}
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
