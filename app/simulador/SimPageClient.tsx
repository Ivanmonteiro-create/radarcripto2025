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
      {/* CSS local — apenas para esta página */}
      <style>{`
        /* Apaga qualquer instância antiga (tarjas e botões externos) */
        .page-simulador .rc-backtop,
        .page-simulador .rc-backtop-fixed { display: none !important; }

        /* Cabeçalho do gráfico (mantém exatamente como está) */
        .page-simulador .compactHeader{
          display:flex; align-items:center; justify-content:space-between;
          gap:8px; padding:6px 8px; margin:0;
          border-bottom:1px solid rgba(255,255,255,.06);
          background: rgba(0,0,0,.25);
        }
        .page-simulador .compactTitle{ margin:0; font-size:12.5px; font-weight:800; opacity:.85; }
        .page-simulador .tvFsBtn{
          width:28px; height:28px; border-radius:8px;
          display:grid; place-items:center;
          background:rgba(255,255,255,.12);
          color:#e6e6e6; border:1px solid rgba(255,255,255,.25);
          cursor:pointer; line-height:1; font-weight:900; font-size:14px;
        }
        .page-simulador .tvFsBtn:hover{ filter:brightness(1.05); }

        /* Painel de controles vira referência para o botão interno */
        .page-simulador .rc-controls{
          position:relative;
          padding-top:8px;   /* respiro mínimo */
        }

        /* Botão "Voltar ao início" DENTRO do painel, na frente do título */
        .page-simulador .backBtnInPanel{
          position:absolute;
          top:6px;                 /* alinha com o topo do painel */
          right:10px;              /* canto direito do quadrado */
          z-index: 5;
          display:inline-flex;
          white-space:nowrap;
          writing-mode: initial;   /* garante horizontal */
          transform: none;
        }
        .page-simulador .backBtnInPanel .rc-btn{
          height: 34px;
          padding: 0 14px;
          border-radius: 10px;
          font-weight: 800;
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
          borderRadius: 0,
          borderRight: '1px solid rgba(255,255,255,.06)',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
        }}
      >
        {!isFs && (
          <div className="compactHeader">
            <h2 className="compactTitle">Gráfico — {symbol}</h2>
            <button
              aria-label="Tela cheia"
              title="Tela cheia"
              className="tvFsBtn"
              onClick={toggleFs}
            >
              [ ]
            </button>
          </div>
        )}

        <div style={{ height: '100%', minHeight: 520 }}>
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
          borderRadius: 0,
          borderLeft: '1px solid rgba(255,255,255,.06)',
        }}
      >
        {/* Botão VERDE dentro do quadrado, na frente do "Controles de Trade" */}
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
