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

// Mantém o widget client-side (TradingView usa window)
const TradingViewWidget = dynamic(() => import('@/components/TradingViewWidget'), {
  ssr: false,
});

export default function SimpageClient() {
  const [symbol, setSymbol] = useState<Pair>('BTCUSDT');
  const [livePrice, setLivePrice] = useState<number | null>(null);

  const onSymbolChange = useCallback((s: string) => {
    setSymbol(s as Pair);
  }, []);

  // Mock leve só para não ficar estático (se já tiver priceFeed, pode remover)
  useEffect(() => {
    const id = setInterval(() => {
      setLivePrice((p) => {
        if (p == null) return null;
        const jitter = (Math.random() - 0.5) * 5;
        return Math.max(0, +(p + jitter).toFixed(2));
      });
    }, 2500);
    return () => clearInterval(id);
  }, []);

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
      <section className="grid grid-cols-12 gap-4 px-3 md:px-4 pb-4">
        {/* GRÁFICO */}
        <div className="col-span-12 lg:col-span-8 rounded-2xl border border-zinc-700/50 bg-zinc-900/40 min-h-[560px]">
          {/* ⬇️ Somente symbol — sem interval/theme/autosize/height */}
          <TradingViewWidget symbol={symbol} />
        </div>

        {/* CONTROLES */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="relative rounded-2xl border border-emerald-700/40 bg-zinc-900/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-zinc-200">Controles de Trade</h2>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold bg-emerald-700/80 hover:bg-emerald-600 text-white"
              >
                Voltar ao início
              </Link>
            </div>

            {/* Par + Preço ao vivo */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
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

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Preço ao vivo</label>
                <div className="w-full rounded-xl bg-zinc-800/70 border border-zinc-700/60 px-3 py-2 text-zinc-200">
                  {livePrice ?? '—'}
                </div>
              </div>
            </div>

            {/* …demais campos/botões existentes permanecem inalterados */}
          </div>
        </aside>
      </section>
    </main>
  );
}
