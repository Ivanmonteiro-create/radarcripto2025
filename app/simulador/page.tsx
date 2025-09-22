'use client';
import { useLayoutFixes } from './layout-fixes';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
export default function PaginaDoSimulador() {
  useLayoutFixes();   // <<< adicione esta linha
  // ...resto do seu componente permanece igual...
}
// Gráfico (TradingView) sem SSR
const TVChart = dynamic(() => import('@/components/TradingViewWidget'), { ssr: false });

// Painel de controles (sem cabeçalho/rodapé/Histórico internos)
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
          style={{
            bottom: 0,     // ↓ baixei para alinhar pela base da barra do TV
            right: 56      // distância lateral para a câmera (~1–2 cm visuais)
          }}
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

        {/* Ajustes finos locais para legibilidade (mantém tudo o resto igual) */}
        <style jsx global>{`
          .tcRoot .btn { font-size: 15px; padding: 10px 12px; border-radius: 10px; }
          .tcRoot .btn.btnBuy, .tcRoot .btn.btnSell { font-weight: 800; }
          .tcRoot .inp { height: 36px; font-size: 15px; }
          .tcRoot .cardMini .cardTitle { font-size: 13px; }
        `}</style>
      </aside>
    </main>
  );
}
// --- HOTFIX: alinhar FS e esconder histórico do miolo sem mexer na estrutura ---
import { useEffect } from "react";

function useHotfixLayout() {
  useEffect(() => {
    const fixFsBtn = () => {
      const btn = document.querySelector(
        'section.panel button[aria-label*="Tela cheia"], section.panel button[title*="Tela cheia"], section.panel .chartFsBtn'
      ) as HTMLElement | null;
      if (btn) {
        btn.style.position = "absolute";
        btn.style.top = "8px";
        btn.style.right = "44px";
        btn.style.bottom = "";      // remove posicionamento por bottom
        btn.style.transform = "none";
        btn.style.zIndex = "6";
      }
    };

    const hideMidHistory = () => {
      document
        .querySelectorAll(
          "section.panel .compactGrid .histRow, section.panel .compactGrid .histWrap, section.panel .compactGrid .historyCard, section.panel .compactGrid .histCard"
        )
        .forEach((el) => ((el as HTMLElement).style.display = "none"));
    };

    // roda agora e nas mudanças de layout
    const runAll = () => {
      fixFsBtn();
      hideMidHistory();
    };
    runAll();

    const obs = new MutationObserver(runAll);
    obs.observe(document.body, {
      subtree: true,
      attributes: true,
      childList: true,
      attributeFilter: ["class", "style"],
    });
    window.addEventListener("resize", runAll);

    return () => {
      obs.disconnect();
      window.removeEventListener("resize", runAll);
    };
  }, []);
}

export default function PaginaDoSimulador() {
  useHotfixLayout();
  // ... resto do seu componente exatamente como já está ...
}
