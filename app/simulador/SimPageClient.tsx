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
      <style>{`
        /* 0) Remover QUALQUER tarja/nav/topbar apenas no simulador */
        body:has(.page-simulador) nav,
        body:has(.page-simulador) header,
        body:has(.page-simulador) .rc-topnav,
        body:has(.page-simulador) .rc-topbar,
        body:has(.page-simulador) .rc-topband,
        body:has(.page-simulador) .rc-topstrip,
        body:has(.page-simulador) .rc-page-top {
          display: none !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .page-simulador > a:first-child { display: none !important; }
        .page-simulador { padding-top: 0 !important; margin-top: 0 !important; }

        /* 1) Remover a LINHA do topo (border-top) de ambos os painéis */
        .page-simulador .panel{
          border-top: 0 !important;
          border-radius: 0 !important;
        }

        /* 2) Botão Tela Cheia ABSOLUTO dentro do painel do gráfico (sem faixa) */
        .page-simulador .tvFsBtn{
          position:absolute; top:8px; right:8px; z-index:40;
          width:28px; height:28px; border-radius:8px;
          display:grid; place-items:center;
          background:rgba(255,255,255,.12);
          color:#e6e6e6; border:1px solid rgba(255,255,255,.25);
          cursor:pointer; line-height:1; font-weight:900; font-size:14px;
        }
        .page-simulador .tvFsBtn:hover{ filter:brightness(1.05); }

        /* 3) Botão VERDE dentro do painel de controles (topo-direito) */
        .page-simulador .rc-controls{ position:relative; padding-top:8px; }
        .page-simulador .backBtnInPanel{
          position:absolute; top: 22px; right: 10px; z-index: 5;
          display:inline-flex; align-items:center; height:34px; white-space:nowrap;
        }
        .page-simulador .backBtnInPanel .rc-btn--green{
          display:inline-flex; height:34px; padding:0 14px; border-radius:8px;
          font-weight:800; background:#18e273; color:#052515;
          box-shadow: 0 0 0 1px rgba(0,255,128,.28), 0 8px 24px rgba(0,0,0,.35);
        }
        .page-simulador .backBtnInPanel .rc-btn--green:hover{
          filter:brightness(1.07); transform:translateY(-1px);
        }

        /* 4) FULLSCREEN: ocupa 100vw x 100dvh e deixa o wrapper crescer */
        .page-simulador :is(:fullscreen, :-webkit-full-screen, :-moz-full-screen){
          width:100vw !important; height:100dvh !important;
          display:flex !important; flex-direction:column !important;
          background:#0a0f0d !important; overflow:hidden !important;
        }
        .page-simulador :is(:fullscreen, :-webkit-full-screen, :-moz-full-screen) .tvChartWrap{
          flex:1 1 auto !important; min-height:0 !important; height:auto !important;
        }
      `}</style>

      {/* ======= GRÁFICO ======= */}
      <section
        ref={chartPanelRef}
        className="panel"
        style={{
          position: 'relative',
          minHeight: '100%',
          height: '100%',
          borderRight: '1px solid rgba(255,255,255,.06)',
          display: 'grid',
          gridTemplateRows: '1fr',
        }}
      >
        {/* Botão de tela cheia dentro do painel, sem criar faixa */}
        {!isFs && (
          <button
            aria-label="Tela cheia"
            title="Tela cheia"
            className="tvFsBtn"
            onClick={toggleFs}
          >
            [ ]
          </button>
        )}

        <div className="tvChartWrap" style={{ height: '100%', minHeight: 520 }}>
          <TradingViewWidget symbol={`BINANCE:${symbol}`} />
        </div>
      </section>

      {/* ======= CONTROLES ======= */}
      <section
        className="panel compactPanel rc-controls"
        style={{
          display: 'grid',
          alignContent: 'start',
          gap: 10,
          minHeight: '100%',
          height: '100%',
          borderLeft: '1px solid rgba(255,255,255,.06)',
        }}
      >
        <div className="backBtnInPanel">
          <a href="/" className="rc-btn rc-btn--green">Voltar ao início</a>
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
