/* app/simulador/page.tsx */
'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Gráfico (seu componente em /components/TradingViewWidget.tsx)
const TVChart = dynamic(() => import('@/components/TradingViewWidget'), { ssr: false });

// Controles (seu componente em /components/TradeControls.tsx)
import TradeControls from '@/components/TradeControls';

export default function SimuladorPage() {
  // Símbolo global do simulador (sincroniza Controles <-> Gráfico)
  const [symbol, setSymbol] = useState<string>('BTCUSDT');

  const handleSymbolChange = useCallback((s: string) => {
    if (!s) return;
    setSymbol(s);
  }, []);

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
      {/* COLUNA ESQUERDA (opcional) */}
      <aside className="leftPanel">
        <div className="panel">
          <div className="muted small">Histórico / Atalhos</div>
        </div>
      </aside>

      {/* COLUNA CENTRAL: GRÁFICO (ocupando a altura total visível) */}
      <section className="panel" style={{ position: 'relative' }}>
        <div
          id="chart-root"
          style={{
            position: 'relative',
            width: '100%',
            height: 'calc(100vh - 140px)', // gráfico grande
          }}
        >
          <TVChart symbol={symbol} />
        </div>

        {/* Ícone Tela Cheia (ao lado da câmera) */}
        <button
          type="button"
          title="Tela cheia"
          aria-label="Tela cheia"
          className="chartFsBtn"
          onClick={toggleFullscreen}
        >
          ⛶
        </button>
      </section>

      {/* COLUNA DIREITA: CONTROLES DE TRADE (sem o link duplicado de Voltar) */}
      <aside className="rightMenu">
        <div className="panel compactPanel">
          <div className="compactHeader">
            <h2 className="compactTitle">Controles de Trade</h2>
          </div>

          <TradeControls
            symbol={symbol}
            onSymbolChange={handleSymbolChange}
          />
        </div>
      </aside>
    </main>
  );
}
