'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const TVChart = dynamic(() => import('@/components/TradingViewWidget'), { ssr: false });
import TradeControls from '@/components/TradeControls';

export default function SimuladorPage() {
  const [symbol, setSymbol] = useState<string>('BTCUSDT');

  const onSymbolChange = useCallback((s: string) => {
    if (s) setSymbol(s);
  }, []);

  // ===== Tela Cheia (atua sobre o #chart-root) =====
  const enterFs = () => document.getElementById('chart-root')?.requestFullscreen?.();
  const exitFs = () => (document as any).exitFullscreen?.();
  const toggleFs = () => {
    const doc: any = document;
    if (!doc.fullscreenElement) enterFs();
    else exitFs();
  };

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
    <main
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 12,
        minHeight: '100dvh',
        padding: 16,
      }}
    >
      {/* COLUNA: GRÁFICO */}
      <section className="panel" style={{ position: 'relative', padding: 12 }}>
        <div
          id="chart-root"
          style={{ position: 'relative', width: '100%', height: 'calc(100vh - 40px)' }}
        >
          <TVChart symbol={`BINANCE:${symbol}`} />
        </div>
      </section>

      {/* COLUNA: PAINEL DE TRADE */}
      <aside className="panel tradePanel">
        <TradeControls
          symbol={symbol}
          onSymbolChange={onSymbolChange}
          onFullscreen={toggleFs}
        />
      </aside>
    </main>
  );
}
