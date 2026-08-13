// app/simulador/SimPageClient.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import TradingViewWidget from '../../components/TradingViewWidget';
import TradeControls from '../../components/TradeControls';
import { useLivePrice } from '../../lib/useLivePrice';
import { useI18n } from '../../components/i18n/LocaleProvider';
import { pageContent } from '../../lib/i18n/pageContent';

type Pair =
  | 'BTCUSDT' | 'ETHUSDT' | 'BNBUSDT' | 'SOLUSDT'
  | 'ADAUSDT' | 'XRPUSDT' | 'DOGEUSDT' | 'LINKUSDT';

export default function SimPageClient() {
  const { locale } = useI18n();
  const copy = pageContent[locale].simulator;
  const [symbol, setSymbol] = useState<Pair>('BTCUSDT');
  const { price: livePrice } = useLivePrice(symbol);

  const chartPanelRef = useRef<HTMLDivElement | null>(null);
  const [isFs, setIsFs] = useState(false);

  // força o TradingView a recalcular dimensões
  const pokeResize = useCallback(() => {
    window.dispatchEvent(new Event('resize'));
    setTimeout(() => window.dispatchEvent(new Event('resize')), 120);
  }, []);

  useEffect(() => {
    const onChange = () => {
      setIsFs(Boolean(document.fullscreenElement));
      pokeResize();
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [pokeResize]);

  const enterFs = useCallback(() => {
    const el = chartPanelRef.current;
    if (!el || document.fullscreenElement) return;
    void el.requestFullscreen().then(pokeResize).catch(() => {});
  }, [pokeResize]);
  const exitFs = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().then(pokeResize).catch(() => {});
    }
  }, [pokeResize]);
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
  }, [enterFs, exitFs]);

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
          <div className="chartTitle">{copy.chart} — {symbol}</div>
          {!isFs && (
            <button
              aria-label={copy.fullscreen}
              title={copy.fullscreen}
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
        <TradeControls
          symbol={symbol}
          onSymbolChange={(s: string) => setSymbol(s as Pair)}
          livePrice={livePrice ?? undefined}
        />
      </section>
    </main>
  );
}
