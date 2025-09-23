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

        {/* ÍCONE DE TELA CHEIA — MESMA LINHA DA CÂMERA (~1–2 cm de distância) */}
        <button
          type="button"
          aria-label="Tela cheia"
          title="Tela cheia (F) / Sair (X)"
          onClick={toggleFs}
          className="chartFsBtn"
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
          <Link href="/" className="btn btn-primary btn-green" style={{ padding: '10px 14px', borderRadius: 10 }}>
            Voltar ao início
          </Link>
        </header>

        {/* Controles (mantém seu componente original) */}
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

        {/* Ajustes finos locais (sem alterar sua estrutura) */}
        <style jsx global>{`
          /* 1) Alinhar o botão de Tela Cheia à câmera (mesma linha, ~1–2cm) */
          section.panel button.chartFsBtn {
            position: absolute !important;
            top: 8px !important;     /* mesma linha do header do TV */
            right: 44px !important;  /* afastado ~1–2cm do botão da câmera */
            bottom: auto !important;
            transform: none !important;
            z-index: 6;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            background: rgba(0,0,0,.35);
            border: 1px solid rgba(255,255,255,.08);
            color: #fff;
            cursor: pointer;
          }

          /* 2) Esconder qualquer "Histórico" duplicado que apareça no miolo do painel */
          section.panel .compactGrid .histRow,
          section.panel .compactGrid .histWrap,
          section.panel .compactGrid .historyCard,
          section.panel .compactGrid .histCard {
            display: none !important;
          }

          /* 3) Botões do TradeControls um pouco maiores */
          .tcRoot .btn { font-size: 15px; padding: 10px 12px; border-radius: 10px; }
          .tcRoot .btn.btnBuy, .tcRoot .btn.btnSell { font-weight: 800; }
          .tcRoot .inp { height: 36px; font-size: 15px; }
          .tcRoot .cardMini .cardTitle { font-size: 13px; }

          /* 4) Forçar verde no "Voltar ao início" (caso algum tema tente trocar) */
          .btn-green {
            background: #12b886 !important;   /* verde */
            color: #0b1f17 !important;
            border-color: rgba(16,185,129,.35) !important;
          }
          .btn-green:hover {
            filter: brightness(1.05);
          }
        `}</style>
      </aside>
    </main>
  );
}
