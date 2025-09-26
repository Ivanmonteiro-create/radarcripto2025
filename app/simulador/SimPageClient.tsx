// app/simulador/SimpageClient.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

type Pair =
  | 'BTCUSDT'
  | 'ETHUSDT'
  | 'BNBUSDT'
  | 'SOLUSDT'
  | 'ADAUSDT'
  | 'XRPUSDT'
  | 'MATICUSDT'
  | 'LINKUSDT';

// IMPORTANTE: mantemos o widget como estava, só não passamos mais props inválidas
const TradingViewWidget = dynamic(() => import('@/components/TradingViewWidget'), {
  ssr: false,
});

export default function SimpageClient() {
  // par inicial
  const [symbol, setSymbol] = useState<Pair>('BTCUSDT');

  // preço ao vivo (seu hook/priceFeed pode atualizar isso depois)
  const [livePrice, setLivePrice] = useState<number | null>(null);

  // callback para troca de par vindo do controle
  const onSymbolChange = useCallback((s: string) => {
    setSymbol(s as Pair);
  }, []);

  // exemplo de mock; se você já tem priceFeed, pode remover isso aqui
  useEffect(() => {
    const id = setInterval(() => {
      setLivePrice((p) => {
        if (p == null) return null;
        // pequeno “ruído” só para não ficar estático
        const jitter = (Math.random() - 0.5) * 5;
        return Math.max(0, +(p + jitter).toFixed(2));
      });
    }, 2500);
    return () => clearInterval(id);
  }, []);

  // opções do select de pares
  const pairs = useMemo<Pair[]>(
    () => [
      'BTCUSDT',
      'ETHUSDT',
      'BNBUSDT',
      'SOLUSDT',
      'ADAUSDT',
      'XRPUSDT',
      'MATICUSDT',
      'LINKUSDT',
    ],
    []
  );

  return (
    <main className="w-full h-full">
      {/* GRADE: gráfico à esquerda, controles à direita */}
      <section className="grid grid-cols-12 gap-4 px-3 md:px-4 pb-4">
        {/* GRÁFICO */}
        <div className="col-span-12 lg:col-span-8 rounded-2xl border border-zinc-700/50 bg-zinc-900/40">
          {/* ⬇️ AQUI ESTÁ A CORREÇÃO: apenas symbol e height (sem interval/theme/autosize) */}
          <TradingViewWidget symbol={symbol} height={560} />
        </div>

        {/* CONTROLES */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="relative rounded-2xl border border-emerald-700/40 bg-zinc-900/40 p-4">
            {/* Header com “Voltar ao início” alinhado à direita */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-zinc-200">Controles de Trade</h2>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold bg-emerald-700/80 hover:bg-emerald-600 text-white"
              >
                Voltar ao início
              </Link>
            </div>

            {/* Seletor de par + preço ao vivo (se houver) */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-1">
                <label className="block text-xs text-zinc-400 mb-1">Par</label>
                <select
                  className="w-full rounded-xl bg-zinc-800/70 border border-zinc-700/60 px-3 py-2 text-zinc-100"
                  value={symbol}
                  onChange={(e) => onSymbolChange(e.target.value)}
                >
                  {pairs.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-xs text-zinc-400 mb-1">Preço ao vivo</label>
                <div className="w-full rounded-xl bg-zinc-800/70 border border-zinc-700/60 px-3 py-2 text-zinc-200">
                  {livePrice ?? '—'}
                </div>
              </div>
            </div>

            {/* Aqui ficam seus demais campos/botões já existentes (não alterados) */}
            {/* … */}
          </div>
        </aside>
      </section>
    </main>
  );
}
