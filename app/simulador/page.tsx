'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// TradingView sem SSR
const TVChart = dynamic(() => import('@/components/TradingViewWidget'), { ssr: false });
// Painel de controles
import TradeControls from '@/components/TradeControls';

export default function SimuladorPage() {
  const [symbol, setSymbol] = useState<string>('BTCUSDT');
  const onSymbolChange = useCallback((s: string) => { if (s) setSymbol(s); }, []);

  // Tela cheia (F entra, X sai)
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
        gridTemplateColumns: '1fr 340px',
        gap: 12,
        height: '100dvh',         // ocupa a viewport toda
        padding: 16,
        overflow: 'hidden',       // sem rolagem na página
      }}
    >
      {/* COLUNA: GRÁFICO */}
      <section className="panel" style={{ position: 'relative', padding: 12, height: '100%' }}>
        <div
          id="chart-root"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',        // enche o painel inteiro
          }}
        >
          <TVChart symbol={symbol} />
        </div>

        {/* Ícone Tela Cheia — MESMA linha da câmera */}
        <button
          type="button"
          aria-label="Tela cheia"
          title="Tela cheia (F) / Sair (X)"
          onClick={toggleFs}
          className="chartFsBtn"
          // posição final é controlada no CSS global com !important
          style={{ position: 'absolute' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>

      {/* COLUNA: PAINEL DE TRADE */}
      <aside
        className="panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          height: '100%',          // enche a coluna toda
          overflow: 'hidden',      // sem rolagem no painel
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Controles de Trade</h2>
          <Link href="/" className="btn btn-primary" style={{ padding: '12px 18px', borderRadius: 10 }}>
            Voltar ao início
          </Link>
        </header>

        {/* Controles centralizados (sem rolagem) */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <TradeControls symbol={symbol} onSymbolChange={onSymbolChange} />
        </div>

        {/* Histórico ÚNICO já fica dentro do TradeControls (rodapé dos controles) */}
      </aside>
    </main>
  );
}
