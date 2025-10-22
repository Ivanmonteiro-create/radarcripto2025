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

  // força o TradingView a recalcular dimensões
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

  // ⌨️ Atalhos: F entra em fullscreen, X sai
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
        /* ==== LIMPA QUALQUER TOPBAR GLOBAL NESTA ROTA ==================== */
        body:has(main.page-simulador) nav,
        body:has(main.page-simulador) header,
        body:has(main.page-simulador) .rc-topnav,
        body:has(main.page-simulador) .rc-topbar,
        body:has(main.page-simulador) .rc-topband,
        body:has(main.page-simulador) .rc-topstrip,
        body:has(main.page-simulador) .rc-page-top,
        body:has(main.page-simulador) .rc-backtop {
          display: none !important;
          height: 0 !important; margin: 0 !important; padding: 0 !important;
          border: 0 !important; background: transparent !important; box-shadow: none !important;
        }
        body:has(main.page-simulador) .rc-main,
        body:has(main.page-simulador) main.page-simulador{ padding-top:0 !important; margin-top:0 !important; }
        body:has(main.page-simulador) .panel{ border-top:0 !important; border-radius:0 !important; }

        /* 🚫 Remove qualquer pseudo (bolinha/selo verde) no main */
        main.page-simulador::before,
        main.page-simulador::after{
          content: none !important;
          display: none !important;
        }

        /* ==== BARRA DO GRÁFICO (restaurada) ============================== */
        .chartHeader{
          height: 36px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; padding: 0 10px;
          border-bottom: 1px solid rgba(255,255,255,.06);
          background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02));
        }
        .chartTitle{
          font-size: 13px; font-weight: 800; letter-spacing: .2px; opacity: .9;
        }
        .chartHeader .tvFsBtn{
          width: 28px; height: 24px; border-radius: 6px;
          display: grid; place-items: center;
          background: rgba(255,255,255,.12);
          color: #e6e6e6;
          border: 1px solid rgba(255,255,255,.25);
          cursor: pointer; line-height:1; font-weight:900; font-size:14px;
        }
        .chartHeader .tvFsBtn:hover{ filter: brightness(1.06); }

        /* Altura do gráfico = total - barra */
        .tvChartWrap{ height: calc(100% - 36px); min-height: 520px; }

        /* ==== CONTROLES: botão verde no topo-direito ====================== */
        .rc-controls{ position: relative; padding-top: 8px; }
        .backBtnInPanel{
          position: absolute; top: 22px; right: 10px; z-index: 5;
          display: inline-flex; align-items: center; height: 34px; white-space: nowrap;
        }
        .rc-btn--green{
          display:inline-flex; height:34px; padding:0 14px; border-radius:8px;
          font-weight:800; background:#18e273; color:#052515;
          box-shadow: 0 0 0 1px rgba(0,255,128,.28), 0 8px 24px rgba(0,0,0,.35);
        }
        .rc-btn--green:hover{ filter:brightness(1.07); transform: translateY(-1px); }

        /* ==== FULLSCREEN: ocupar tudo, sem sobras ======================== */
        :is(:fullscreen, :-webkit-full-screen, :-moz-full-screen){
          width:100vw !important; height:100dvh !important;
          display:flex !important; flex-direction:column !important;
          background:#0a0f0d !important; overflow:hidden !important;
        }
        :is(:fullscreen, :-webkit-full-screen, :-moz-full-screen) .tvChartWrap{
          height:100% !important; min-height:0 !important;
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
          gridTemplateRows: '36px 1fr', // header + gráfico
        }}
      >
        {/* Barra do gráfico (restaurada) */}
        <div className="chartHeader">
          <div className="chartTitle">Gráfico — {symbol}</div>
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
        </div>

        {/* Canvas/iframe do TradingView */}
        <div className="tvChartWrap">
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
        {/* Botão verde dentro do painel de controles */}
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
