/* app/simulador/page.tsx */
'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Gráfico (seu componente em /components/TradingViewWidget.tsx)
const TVChart = dynamic(() => import('@/components/TradingViewWidget'), { ssr: false });

// Controles (seu componente em /components/TradeControls.tsx)
import TradeControls from '@/components/TradeControls';

export default function SimuladorPage() {
  // Símbolo global do simulador (sincroniza Controles <-> Gráfico)
  const [symbol, setSymbol] = useState<string>('BTCUSDT');

  // Handler passado aos controles para trocar o par
  const handleSymbolChange = useCallback((s: string) => {
    if (!s) return;
    setSymbol(s);
  }, []);

  // Fullscreen simples para o contêiner do gráfico
  const toggleFullscreen = () => {
    const el = document.getElementById('chart-root');
    if (!el) return;
    const doc: any = document;
    if (!doc.fullscreenElement) {
      (el as any).requestFullscreen?.();
    } else {
      doc.exitFullscreen?.();
    }
  };

  return (
    <main className="wrapper simWrap">
      {/* COLUNA ESQUERDA (opcional): histórico/atalhos */}
      <aside className="leftPanel">
        <div className="panel">
          <div className="muted small">Histórico / Atalhos</div>
        </div>
      </aside>

      {/* COLUNA CENTRAL: GRÁFICO */}
      <section className="panel" style={{ position: 'relative' }}>
        <div id="chart-root" style={{ position: 'relative' }}>
          {/* Passamos o símbolo atual para o gráfico (se o componente aceitar) */}
          <TVChart symbol={symbol} />
        </div>

        {/* Ícone Tela Cheia (classes já existem no globals.css) */}
        <button
          type="button"
          title="Tela cheia"
          aria-label="Tela cheia"
          className="chartFsBtn"
          onClick={toggleFullscreen}
        >
          ⛶
        </button>

        {/* Se quiser, botoeira/indicadores no topo do gráfico */}
        {/* <div className="graphTopBar">
          <button className="indBtn">Indicadores</button>
        </div> */}
      </section>

      {/* COLUNA DIREITA: CONTROLES DE TRADE */}
      <aside className="rightMenu">
        <div className="panel compactPanel">
          <header className="compactHeader">
            <h2 className="compactTitle">Controles de Trade</h2>
            <Link href="/" className="btn btn-primary">Voltar ao início</Link>
          </header>

          {/* IMPORTANTE: passar os props exigidos pelo seu TradeControls */}
          <TradeControls
            symbol={symbol}
            onSymbolChange={handleSymbolChange}
          />
        </div>
      </aside>
    </main>
  );
}
