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

  // -------- Fullscreen do painel do gráfico --------
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
      const k = e.key.toLowerCase();
      if (k === 'f') { e.preventDefault(); enterFs(); }
      if (k === 'x') { e.preventDefault(); exitFs(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <main
      className="wrapper"
      style={{
        gridTemplateColumns: '1fr 380px', // controles um pouco mais altos, mas painel estreito
        alignItems: 'stretch'
      }}
    >
      {/* ================== GRÁFICO ================== */}
      <section
        ref={chartPanelRef}
        className="panel"
        style={{ position: 'relative', minHeight: '78vh' }}
      >
        {/* Cabeçalho do painel (esconde no FS para liberar área) */}
        {!isFs && (
          <div className="compactHeader" style={{ marginBottom: 8 }}>
            <h2 className="compactTitle" style={{ margin: 0 }}>Gráfico — {symbol}</h2>
          </div>
        )}

        {/* Botão de Tela Cheia — acima da “câmera” (só quando NÃO está em FS) */}
        {!isFs && (
          <button
            aria-label="Tela cheia"
            title="Tela cheia"
            onClick={toggleFs}
            style={{
              position: 'absolute',
              top: 4,
              right: 44,        // ~1 cm da “câmera”
              zIndex: 6,
              width: 28, height: 28, borderRadius: 8,
              display: 'grid', placeItems: 'center',
              background: 'rgba(255,255,255,.12)',
              color: '#e6e6e6',
              border: '1px solid rgba(255,255,255,.25)',
              cursor: 'pointer'
            }}
          >
            ▢
          </button>
        )}

        {/* Overlay para esconder o quadradinho do TradingView em FS */}
        {isFs && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 4, right: 8,
              width: 56, height: 32,
              background: 'transparent',
              zIndex: 7,
              pointerEvents: 'none' // só cobre visualmente
            }}
          />
        )}

        <div style={{ height: isFs ? '100vh' : '72vh', minHeight: 520 }}>
          <TradingViewWidget
            symbol={symbol}
            interval="1"
            theme="dark"
            autosize
            height={undefined}
          />
        </div>
      </section>

      {/* ================== CONTROLES ================== */}
      <section
        className="panel compactPanel"
        style={{
          display: 'grid',
          alignContent: 'start',
          gap: 10,
          minHeight: '78vh' // casa visualmente com o gráfico
        }}
      >
        <TradeControls
          symbol={symbol}
          onSymbolChange={(s: string) => setSymbol(s as Pair)}
          livePrice={livePrice}
        />
      </section>
    </main>
  );
}
