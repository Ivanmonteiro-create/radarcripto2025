// app/simulador/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Gráfico TradingView (o mesmo componente que você já usa)
const TVChart = dynamic(() => import('@/components/TradingViewWidget'), { ssr: false });

// Painel de controles (o mesmo que você já usa)
import TradeControls from '@/components/TradeControls';

export default function SimuladorPage() {
  const [symbol, setSymbol] = useState<string>('BTCUSDT');

  const onSymbolChange = useCallback((s: string) => {
    if (s) setSymbol(s);
  }, []);

  // === Tela cheia (F entra/alternar, X sai) ===============================
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
  // =======================================================================

  return (
    // Layout ESPECÍFICO do simulador (não altera a Home):
    <main
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 280px',   // gráfico + painel mais largo
        gap: 12,
        minHeight: '100dvh',
        padding: 16,
      }}
    >
      {/* COLUNA: Gráfico (margens laterais um pouco menores) */}
      <section className="panel" style={{ position: 'relative', padding: 12 }}>
        <div
          id="chart-root"
          style={{
            position: 'relative',
            width: '100%',
            height: 'calc(100vh - 40px)', // preenche a tela
          }}
        >
          <TVChart symbol={symbol} />
        </div>

        {/* Ícone TELACHEIA ao lado da câmera (mesma linha, ~1cm de folga) */}
        <button
          type="button"
          aria-label="Tela cheia"
          title="Tela cheia (F) / Sair (X)"
          onClick={toggleFs}
          className="chartFsBtn"
          // a câmera do TV fica encostada na direita; deixamos ~74px para dar “respiro”
          style={{ top: 6, right: 74 }}
        >
          {/* setas para fora (estilo original) */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </section>

      {/* COLUNA: Painel de Trade (tamanho “normal/maior”) */}
      <aside className="panel" style={{ fontSize: 14, lineHeight: 1.28, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Controles de Trade</h2>

        {/* ÚNICO bloco de controles (sem duplicatas) */}
        <TradeControls symbol={symbol} onSymbolChange={onSymbolChange} />

        {/* Histórico logo abaixo de Comprar/Vender (fica por último no painel) */}
        <div style={{ display: 'grid', gap: 8 }}>
          <div className="cardMini">
            <div className="cardTitle">Histórico</div>
            <div className="histWrap fill">
              <div className="histRow muted xs">Sem operações ainda.</div>
            </div>
          </div>
        </div>

        {/* Único “Voltar ao início” — mantido somente aqui embaixo */}
        <div style={{ marginTop: 'auto' }}>
          <Link href="/" className="btn btn-primary">Voltar ao início</Link>
        </div>
      </aside>
    </main>
  );
}
