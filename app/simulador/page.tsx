/* app/simulador/page.tsx */
'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Gráfico
const TVChart = dynamic(() => import('@/components/TradingViewWidget'), { ssr: false });

// Controles
import TradeControls from '@/components/TradeControls';

export default function SimuladorPage() {
  const [symbol, setSymbol] = useState<string>('BTCUSDT');

  const onSymbolChange = useCallback((s: string) => {
    if (s) setSymbol(s);
  }, []);

  // Fullscreen helpers
  const enterFs = () => document.getElementById('chart-root')?.requestFullscreen?.();
  const exitFs = () => (document as any).exitFullscreen?.();
  const toggleFs = () => {
    const doc: any = document;
    if (!doc.fullscreenElement) enterFs();
    else exitFs();
  };

  // Atalhos F / X
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
    <main className="wrapper">
      {/* SEM coluna esquerda — o histórico vai dentro do painel à direita */}
      <section className="panel" style={{ position: 'relative', gridColumn: '1 / span 2' }}>
        <div
          id="chart-root"
          style={{ position: 'relative', width: '100%', height: 'calc(100vh - 40px)' }}
        >
          <TVChart symbol={symbol} />
        </div>

        {/* Ícone de tela cheia (SVG), alinhado ao lado da câmera */}
        <button
          type="button"
          title="Tela cheia (F) / Sair (X)"
          aria-label="Tela cheia"
          className="chartFsBtn"
          onClick={toggleFs}
          style={{ top: 6, right: 44 }}
        >
          {/* setas para fora (ícone “original-style”) */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </section>

      {/* CONTROLES DE TRADE — tamanho normal/maior + histórico embaixo */}
      <aside className="rightMenu">
        <div className="panel" style={{ fontSize: 14, lineHeight: 1.26 }}>
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
            <Link href="/" className="btn btn-primary">Voltar ao início</Link>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Controles de Trade</h2>
          </header>

          {/* SEUS CONTROLES (apenas um bloco) */}
          <TradeControls symbol={symbol} onSymbolChange={onSymbolChange} />

          {/* HISTÓRICO & ATALHOS — agora AQUI embaixo */}
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            <div className="cardMini">
              <div className="cardTitle">Histórico</div>
              <div className="histWrap fill">
                <div className="histRow muted xs">Sem operações ainda.</div>
              </div>
            </div>

            <div className="cardMini">
              <div className="cardTitle">Atalhos</div>
              <div className="muted xs">F: Tela cheia &nbsp;|&nbsp; X: Sair tela cheia</div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
