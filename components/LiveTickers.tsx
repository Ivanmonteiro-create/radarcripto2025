'use client';

import { useMemo } from 'react';
import { useLivePrice } from '@/lib/useLivePrice';

type Pair =
  | 'ADAUSDT' | 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT'
  | 'LINKUSDT' | 'BNBUSDT' | 'XRPUSDT' | 'DOGEUSDT';

const PAIRS: Pair[] = [
  'ADAUSDT',
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'LINKUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'DOGEUSDT',
];

function formatPrice(v: number | null) {
  if (v == null || Number.isNaN(v)) return '—';
  // Formatação curta mas legível (tabular-nums no CSS)
  if (v >= 1000) return v.toLocaleString('pt-PT', { maximumFractionDigits: 2 });
  if (v >= 1) return v.toLocaleString('pt-PT', { maximumFractionDigits: 2 });
  return v.toLocaleString('pt-PT', { maximumFractionDigits: 6 });
}

export default function LiveTickers() {
  // Busca os preços numa única render
  const prices = useMemo(() => {
    return PAIRS.map((p) => ({ pair: p }));
  }, []);

  return (
    <aside className="ticker-stack" aria-label="Cotações ao vivo">
      {prices.map(({ pair }) => (
        <TickerCard key={pair} pair={pair} />
      ))}
    </aside>
  );
}

function TickerCard({ pair }: { pair: Pair }) {
  const price = useLivePrice(pair); // já existe no seu projeto
  return (
    <div className="ticker-card">
      <span className="sym">{pair.replace('USDT', '/USDT')}</span>
      <span className="px">{formatPrice(price)}</span>
    </div>
  );
}
