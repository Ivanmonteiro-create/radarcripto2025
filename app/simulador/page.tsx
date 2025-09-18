'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Gráfico (TradingView) sem SSR
const TVChart = dynamic(() => import('@/components/TradingViewWidget'), { ssr: false });

// Painel de controles (agora sem cabeçalho/rodapé/Histórico internos)
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'f') { e.preventDefault(); toggleFs(); }
      if (k === 'x') { e.preventDefault(); exitFs(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
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
          <TVChart symbol={symbol} />
        </div>

        {/* ÍCONE DE TELA CHEIA — MESMA LINHA DA CÂMERA, ~1–2cm de distância */}
        <button
          type="button"
          aria-label="Tela cheia"
          title="Tela cheia (F) / Sair (X)"
          onClick={toggleFs}
          className="chartFsBtn"
          style={{ bottom: 2, right: 56 }}   // <- alinhado pela base e afastado da câmera
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>

      {/* COLUNA: PAINEL DE TRADE (apenas um cabeçalho e um histórico ao final) */}
      <aside
        className="panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          fontSize: 16,
          lineHeight: 1.35,
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
          <Link href="/" className="btn btn-primary" style={{ padding: '10px 14px', borderRadius: 10 }}>
            Voltar ao início
          </Link>
        </header>

        {/* Controles (sem títulos/rodapés/Histórico duplicados) */}
        <div className="tcRoot">
          <TradeControls symbol={symbol} onSymbolChange={onSymbolChange} />
        </div>

        {/* ÚNICO Histórico mantido embaixo */}
        <div className="cardMini" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="cardTitle">Histórico</div>
          <div className="histWrap fill">
            <div className="histRow muted xs">Sem operações ainda.</div>
          </div>
        </div>
      </aside>

      {/* Ajustes finos locais para legibilidade (mantém tudo o resto igual) */}
      <style jsx global>{`
        .tcRoot .btn { font-size: 15px; padding: 10px 12px; border-radius: 10px; }
        .tcRoot .btn.btnBuy, .tcRoot .btn.btnSell { font-weight: 800; }
        .tcRoot .inp { height: 36px; font-size: 15px; }
        .tcRoot .cardMini .cardTitle { font-size: 13px; }
      `}</style>
    </main>
  );
}
