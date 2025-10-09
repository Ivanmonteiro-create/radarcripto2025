'use client';

import { useEffect, useRef, useState } from 'react';
import TradingViewWidget from '../../components/TradingViewWidget';
import TradeControls from '../../components/TradeControls';
import { useLivePrice } from '../../lib/priceFeed';

type Pair =
  | 'BTCUSDT' | 'ETHUSDT' | 'BNBUSDT' | 'SOLUSDT'
  | 'ADAUSDT' | 'XRPUSDT' | 'DOGEUSDT' | 'LINKUSDT';

export default function SimPageClient() {
  const [symbol, setSymbol] = useState<Pair>('BTCUSDT');
  const livePrice = useLivePrice(symbol);

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
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: 0,
        padding: 0,
        height: '100dvh',
        alignItems: 'stretch',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* GRÁFICO */}
      <section
        ref={chartPanelRef}
        className="panel"
        style={{
          position: 'relative',
          minHeight: '100%',
          height: '100%',
          borderRadius: 0,
          borderRight: '1px solid rgba(255,255,255,.06)',
        }}
      >
        {!isFs && (
          <button
            aria-label="Tela cheia"
            title="Tela cheia"
            onClick={toggleFs}
            style={{
              position: 'absolute',
              top: 8,
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

        <div style={{ height: '100%', minHeight: 520 }}>
          <TradingViewWidget symbol={`BINANCE:${symbol}`} />
        </div>
      </section>

      {/* CONTROLES + VOLTAR */}
      <section
        className="panel"
        style={{
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          gap: 10,
          minHeight: '100%',
          height: '100%',
          borderRadius: 0,
          borderLeft: '1px solid rgba(255,255,255,.06)',
          position: 'relative',
        }}
      >
        {/* Botão no topo do painel de Controles */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'linear-gradient(180deg, rgba(6,18,12,.92), rgba(6,18,12,.75))',
          padding: '8px 8px 6px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <a
            href="/"
            className="btn"
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              fontWeight: 800,
            }}
          >
            Voltar ao início
          </a>
        </div>

        <div style={{ overflow: 'auto', paddingTop: 2 }}>
          <TradeControls
            symbol={symbol}
            onSymbolChange={(s: string) => setSymbol(s as Pair)}
            livePrice={livePrice}
          />
        </div>
      </section>
    </main>
  );
}
