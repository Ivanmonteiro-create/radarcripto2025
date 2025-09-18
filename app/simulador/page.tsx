// app/simulador/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Gráfico (TradingView) sem SSR
const TVChart = dynamic(() => import('@/components/TradingViewWidget'), { ssr: false });
// Painel de controles
import TradeControls from '@/components/TradeControls';

export default function SimuladorPage() {
  const [symbol, setSymbol] = useState<string>('BTCUSDT');

  const onSymbolChange = useCallback((s: string) => {
    if (s) setSymbol(s);
  }, []);

  // ========= Tela Cheia =========
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
  // ==============================

  return (
    <main
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px', // painel ligeiramente menor (sobra + área para o gráfico)
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

        {/* ÍCONE DE TELA CHEIA – mesma linha da CÂMERA (canto inferior direito do TV) */}
        <button
          type="button"
          aria-label="Tela cheia"
          title="Tela cheia (F) / Sair (X)"
          onClick={toggleFs}
          className="chartFsBtn"
          // usar bottom para alinhar com a linha da câmera; right deixa ~1–2 cm de distância
          style={{ bottom: 10, right: 56 }}
        >
          {/* ícone padrão (expand corners) */}
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
          // ↑ aumentei a base tipográfica do painel para “encher” melhor o espaço
          fontSize: 16,
          lineHeight: 1.35,
        }}
      >
        {/* Cabeçalho ÚNICO (remove duplicação inferior) */}
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

        {/* Único conjunto de controles — envólucro com “bump” nos botões/campos */}
        <div className="tcRoot">
          <TradeControls symbol={symbol} onSymbolChange={onSymbolChange} />
        </div>

        {/* Histórico abaixo dos controles */}
        <div className="cardMini" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="cardTitle">Histórico</div>
          <div className="histWrap fill">
            <div className="histRow muted xs">Sem operações ainda.</div>
          </div>
        </div>
      </aside>

      {/* Ajustes finos de tamanho nos botões/campos do painel (escopo local) */}
      <style jsx global>{`
        /* aumenta botões e inputs dentro do wrapper dos controles */
        .tcRoot .btn { font-size: 15px; padding: 10px 12px; border-radius: 10px; }
        .tcRoot .btn.btnBuy, .tcRoot .btn.btnSell { font-weight: 800; }
        .tcRoot .inp { height: 36px; font-size: 15px; }
        .tcRoot .cardMini .cardTitle { font-size: 13px; }
      `}</style>
    </main>
  );
}
