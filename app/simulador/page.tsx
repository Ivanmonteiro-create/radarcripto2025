'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Gráfico (TradingView) sem SSR
const TVChart = dynamic(() => import('@/components/TradingViewWidget'), { ssr: false });

// Painel de controles
import TradeControls from '@/components/TradeControls';

export default function SimuladorPage() {
  const [symbol, setSymbol] = useState<string>('BTCUSDT');

  const onSymbolChange = useCallback((s: string) => {
    if (s) setSymbol(s);
  }, []);

  /* ========= Tela Cheia ========= */
  const enterFs = () => document.getElementById('chart-root')?.requestFullscreen?.();
  const exitFs = () => (document as any).exitFullscreen?.();
  const toggleFs = () => {
    const doc: any = document;
    if (!doc.fullscreenElement) enterFs();
    else exitFs();
  };
  /* ================================= */

  return (
    <main
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 12,
        minHeight: '100dvh',
        padding: 16,
      }}
    >
      {/* COLUNA: GRÁFICO */}
      <section className="panel" style={{ position: 'relative', padding: 12 }}>
        <div
          id="chart-root"
          style={{
            position: 'relative',
            width: '100%',
            height: 'calc(100vh - 40px)',
          }}
        >
          <TVChart symbol={`BINANCE:${symbol}`} />
        </div>
      </section>

      {/* COLUNA: PAINEL DE TRADE */}
      <aside
        className="panel tradePanelShell"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          fontSize: 16,
          lineHeight: 1.35,
        }}
      >
        {/* Cabeçalho do painel com “Voltar ao início” e Tela Cheia */}
        <header className="tcHeader">
          <h2 className="tcTitle">Controles de Trade</h2>
          <div className="tcHeaderActions">
            <button
              type="button"
              aria-label="Tela cheia"
              title="Tela cheia (F) / Sair (X)"
              onClick={toggleFs}
              className="btn chartFsBtn--header"
            >
              ⤢
            </button>
            <Link href="/" className="btn btn-primary tcBackBtn">
              Voltar ao início
            </Link>
          </div>
        </header>

        {/* Controles */}
        <TradeControls symbol={symbol} onSymbolChange={onSymbolChange} />
      </aside>
    </main>
  );
}
