'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import TradeControls from '@/components/TradeControls';

// Gráfico (TradingView) sem SSR
const TVChart = dynamic(() => import('@/components/TradingViewWidget'), { ssr: false });

type HistItem = { side: 'BUY' | 'SELL'; symbol: string; price: number; ts: number };

export default function SimuladorPage() {
  const [symbol, setSymbol] = useState<string>('BTCUSDT');
  const [history, setHistory] = useState<HistItem[]>([]);

  const onSymbolChange = useCallback((s: string) => {
    if (s) setSymbol(s);
  }, []);

  // Mock simples de preço (substitua por feed do chart quando quiser)
  const [price, setPrice] = useState<number>(116823.69);
  useEffect(() => {
    const id = setInterval(() => {
      setPrice(p => Number((p + (Math.random() - 0.5) * 15).toFixed(2)));
    }, 1500);
    return () => clearInterval(id);
  }, []);

  /* ====== Tela Cheia (apenas lógica) ====== */
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
  /* ======================================== */

  // Callbacks vindos dos botões Comprar/Vender/Resetar do painel
  const handleBuy = useCallback(() => {
    setHistory(h => [{ side: 'BUY', symbol, price, ts: Date.now() }, ...h]);
  }, [symbol, price]);

  const handleSell = useCallback(() => {
    setHistory(h => [{ side: 'SELL', symbol, price, ts: Date.now() }, ...h]);
  }, [symbol, price]);

  const handleReset = useCallback(() => setHistory([]), []);

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
          style={{ position: 'relative', width: '100%', height: 'calc(100vh - 40px)' }}
        >
          <TVChart symbol={`BINANCE:${symbol}`} />
        </div>

        {/* Ícone de Tela Cheia — sem estilos inline; a classe .chartFsBtn (globals.css) alinha com a câmera */}
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
        style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 16, lineHeight: 1.35 }}
      >
        <header
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Controles de Trade</h2>
          <Link href="/" className="btn btn-primary" style={{ padding: '12px 18px', borderRadius: 10 }}>
            Voltar ao início
          </Link>
        </header>

        {/* Controles (SEM histórico interno) */}
        <div className="tcRoot">
          <TradeControls
            symbol={symbol}
            onSymbolChange={onSymbolChange}
            onBuy={handleBuy}
            onSell={handleSell}
            onReset={handleReset}
            livePrice={price}
          />
        </div>

        {/* Histórico ÚNICO (apenas aqui embaixo) */}
        <div className="cardMini historyCard" style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <div className="cardTitle">Histórico</div>
          <div className="histWrap fill">
            {history.length === 0 && <div className="histRow muted xs">Sem operações ainda.</div>}
            {history.map((h, i) => (
              <div className="histRow" key={i}>
                {new Date(h.ts).toLocaleString('pt-BR')} — {h.side} {h.symbol} @ {h.price.toLocaleString('pt-BR')}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
