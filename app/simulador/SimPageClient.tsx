'use client';

import { useEffect, useRef, useState } from 'react';
import TradingViewWidget from '../../components/TradingViewWidget';
import TradeControls from '../../components/TradeControls';
import { useLivePrice } from '../../lib/priceFeed';

type Pair =
  | 'BTCUSDT' | 'ETHUSDT' | 'BNBUSDT' | 'SOLUSDT'
  | 'ADAUSDT' | 'XRPUSDT' | 'DOGEUSDT' | 'LINKUSDT'; // ← trocamos DOT por LINK

export default function SimPageClient() {
  const [symbol, setSymbol] = useState<Pair>('BTCUSDT');
  const livePrice = useLivePrice(symbol);

  const chartPanelRef = useRef<HTMLDivElement | null>(null);
  const [isFs, setIsFs] = useState(false);

  // Sincroniza estado do Fullscreen
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
  const exitFs = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
  };
  const toggleFs = () => (document.fullscreenElement ? exitFs() : enterFs());

  // Atalhos F (entrar) e X (sair)
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
        gridTemplateColumns: '1fr 380px',
        alignItems: 'stretch',
        position: 'relative',
      }}
    >
      {/* Voltar ao início — canto direito superior */}
      {!isFs && (
        <a
          href="/"
          className="btn tcBackBtn"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 50,
            padding: '10px 14px',
            borderRadius: 12,
            fontWeight: 800,
          }}
        >
          Voltar ao início
        </a>
      )}

      {/* Painel do gráfico */}
      <section
        ref={chartPanelRef}
        className="panel"
        style={{ position: 'relative', minHeight: '78vh' }}
      >
        {!isFs && (
          <div className="compactHeader" style={{ marginBottom: 8 }}>
            <h2 className="compactTitle" style={{ margin: 0 }}>
              Gráfico — {symbol}
            </h2>
          </div>
        )}

        {/* Botão Tela Cheia — ACIMA da câmera (canto direito inferior) */}
        {!isFs && (
          <button
            aria-label="Tela cheia"
            title="Tela cheia"
            onClick={toggleFs}
            style={{
              position: 'absolute',
              bottom: 44,          // ↑ alinhado verticalmente “acima” da câmera
              right: 8,
              zIndex: 40,
              width: 28,
              height: 28,
              borderRadius: 8,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(255,255,255,.12)',
              color: '#e6e6e6',
              border: '1px solid rgba(255,255,255,.25)',
              cursor: 'pointer',
              lineHeight: 1,
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            [ ]
          </button>
        )}

        <div style={{ height: isFs ? '100vh' : '72vh', minHeight: 520 }}>
          <TradingViewWidget symbol={`BINANCE:${symbol}`} />
        </div>
      </section>

      {/* Controles */}
      <section
        className="panel compactPanel"
        style={{ display: 'grid', alignContent: 'start', gap: 10, minHeight: '78vh' }}
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
