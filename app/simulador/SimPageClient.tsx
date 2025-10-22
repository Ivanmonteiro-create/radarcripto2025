// app/simulador/SimPageClient.tsx
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

  const pokeResize = () => {
    window.dispatchEvent(new Event('resize'));
    setTimeout(() => window.dispatchEvent(new Event('resize')), 120);
  };

  useEffect(() => {
    const onChange = () => {
      setIsFs(Boolean(document.fullscreenElement));
      pokeResize();
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const enterFs = () => {
    const el = chartPanelRef.current;
    if (!el || document.fullscreenElement) return;
    void el.requestFullscreen().then(pokeResize).catch(() => {});
  };
  const exitFs = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().then(pokeResize).catch(() => {});
    }
  };
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
      className="page-simulador"
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
          display: 'grid',
          gridTemplateRows: '1fr',
        }}
      >
        {/* Botão Tela Cheia ABSOLUTO (não cria faixa) */}
        {!isFs && (
          <button
            aria-label="Tela cheia"
            title="Tela cheia"
            onClick={toggleFs}
            className="tvFsBtn"
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

        <div className="tvChartWrap" style={{ height: '100%', minHeight: 520 }}>
          <TradingViewWidget symbol={`BINANCE:${symbol}`} />
        </div>
      </section>

      {/* CONTROLES */}
      <section
        className="panel compactPanel rc-controls"
        style={{
          display: 'grid',
          alignContent: 'start',
          gap: 10,
          minHeight: '100%',
          height: '100%',
          borderRadius: 0,
          borderLeft: '1px solid rgba(255,255,255,.06)',
          paddingTop: 8,
          position: 'relative',
        }}
      >
        {/* Voltar ao início (verde) dentro do painel */}
        <div
          className="backBtnInPanel"
          style={{
            position: 'absolute',
            top: 22, // você ajustou para 22px
            right: 10,
            zIndex: 5,
            display: 'inline-flex',
            alignItems: 'center',
            height: 34,
            whiteSpace: 'nowrap',
          }}
        >
          <a
            href="/"
            className="rc-btn rc-btn--green"
            style={{
              display: 'inline-flex',
              height: 34,
              padding: '0 14px',
              borderRadius: 8,
              fontWeight: 800,
              background: '#18e273',
              color: '#052515',
              boxShadow:
                '0 0 0 1px rgba(0,255,128,.28), 0 8px 24px rgba(0,0,0,.35)',
            }}
          >
            Voltar ao início
          </a>
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
