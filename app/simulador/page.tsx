/* app/simulador/page.tsx */
'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

// Gráfico (seu componente existente em /components/TradingViewWidget.tsx)
const TVChart = dynamic(() => import('@/components/TradingViewWidget'), { ssr: false });

// Controles (seu componente existente em /components/TradeControls.tsx)
import TradeControls from '@/components/TradeControls';

export default function SimuladorPage() {
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
      {/* COLUNA ESQUERDA (opcional): você pode usar para histórico/atalhos */}
      <aside className="leftPanel">
        <div className="panel">
          <div className="muted small">Histórico / Atalhos</div>
        </div>
      </aside>

      {/* COLUNA CENTRAL: GRÁFICO */}
      <section className="panel" style={{ position: 'relative' }}>
        <div id="chart-root" style={{ position: 'relative' }}>
          <TVChart />
        </div>

        {/* Botão de Tela Cheia (mesmas classes do globals.css) */}
        <button
          type="button"
          title="Tela cheia"
          aria-label="Tela cheia"
          className="chartFsBtn"
          onClick={toggleFullscreen}
        >
          ⛶
        </button>

        {/* Espaço para botões/indicadores se você usar (as classes já existem no CSS) */}
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

          {/* Seu painel de controles exatamente como já usa */}
          <TradeControls />
        </div>
      </aside>
    </main>
  );
}
