// app/simulador/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const TVChart = dynamic(() => import('@/components/TradingViewWidget'), { ssr: false });
import TradeControls from '@/components/TradeControls';

export default function SimuladorPage() {
  const [symbol, setSymbol] = useState<string>('BTCUSDT');

  const onSymbolChange = useCallback((s: string) => {
    if (s) setSymbol(s);
  }, []);

  // ===== Tela Cheia (F alterna, X sai) =====
  const enterFs = () => document.getElementById('chart-root')?.requestFullscreen?.();
  const exitFs  = () => (document as any).exitFullscreen?.();
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
  // =========================================

  return (
    // Layout específico do simulador
    <main
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px', // ajustado (reduzi ~1,5 cm)
        gap: 12,
        minHeight: '100dvh',
        padding: 16,
      }}
    >
      {/* COLUNA: Gráfico */}
      <section className="panel" style={{ position: 'relative', padding: 12 }}>
        <div
          id="chart-root"
          style={{
            position: 'relative',
            width: '100%',
            height: 'calc(100vh - 40px)',
          }}
        >
          <TVChart symbol={symbol} />
        </div>

        {/* Ícone Tela Cheia — mesma linha da câmera */}
        <button
          type="button"
          aria-label="Tela cheia"
          title="Tela cheia (F) / Sair (X)"
          onClick={toggleFs}
          className="chartFsBtn"
          style={{ top: 6, right: 74 }} // alinhado com a câmera
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </section>

      {/* COLUNA: Painel de Trade */}
      <aside
        className="panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          fontSize: 14,
          lineHeight: 1.28,
        }}
      >
        {/* Cabeçalho do painel: título + Voltar ao início */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Controles de Trade</h2>
          <Link href="/" className="btn btn-primary" style={{ padding: '8px 12px', borderRadius: 10 }}>
            Voltar ao início
          </Link>
        </header>

        {/* ÚNICO bloco de controles */}
        <TradeControls symbol={symbol} onSymbolChange={onSymbolChange} />

        {/* Histórico abaixo dos controles */}
        <div className="cardMini" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="cardTitle">Histórico</div>
          <div className="histWrap fill">
            <div className="histRow muted xs">Sem operações ainda.</div>
          </div>
        </div>
      </aside>
    </main>
  );
}
