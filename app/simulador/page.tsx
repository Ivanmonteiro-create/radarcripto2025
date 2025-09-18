/* app/simulador/page.tsx — SIMULADOR */
'use client';

import { useState, useCallback, useEffect } from 'react';
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

  // Fullscreen helpers
  const enterFs = () => {
    const el = document.getElementById('chart-root');
    if (!el) return;
    (el as any).requestFullscreen?.();
  };
  const exitFs = () => (document as any).exitFullscreen?.();
  const toggleFs = () => {
    const doc: any = document;
    if (!doc.fullscreenElement) enterFs();
    else exitFs();
  };

  // Atalhos: F (fullscreen) / X (sair)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'f') { e.preventDefault(); toggleFs(); }
      if (k === 'x') { e.preventDefault(); exitFs(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <main className="wrapper simWrap">
      {/* COLUNA ESQUERDA (opcional) */}
      <aside className="leftPanel">
        <div className="panel">
          <div className="muted small">Histórico / Atalhos</div>
        </div>
      </aside>

      {/* COLUNA CENTRAL: GRÁFICO (preenche a altura) */}
      <section className="panel" style={{ position: 'relative' }}>
        <div
          id="chart-root"
          style={{
            position: 'relative',
            width: '100%',
            height: 'calc(100vh - 40px)', // gráfico GRANDE como antes
          }}
        >
          <TVChart symbol={symbol} />
        </div>

        {/* Ícone Tela Cheia — alinhado ao lado da câmera */}
        <button
          type="button"
          title="Tela cheia (F) / Sair (X)"
          aria-label="Tela cheia"
          className="chartFsBtn"
          onClick={toggleFs}
          // garante alinhamento fino se precisar:
          style={{ top: 6, right: 44 }}
        >
          ⛶
        </button>
      </section>

      {/* COLUNA DIREITA: CONTROLES DE TRADE — “tamanho natural” */}
      <aside className="rightMenu">
        <div
          className="panel"
          style={{
            fontSize: 14,        // maior que o compacto
            lineHeight: 1.25,
          }}
        >
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Controles de Trade</h2>
          </header>

          <TradeControls
            symbol={symbol}
            onSymbolChange={handleSymbolChange}
          />
        </div>
      </aside>
    </main>
  );
}
