// /components/TradingViewWidget.tsx
'use client';

import React, { useMemo } from 'react';

type Props = {
  symbol: string;
  interval?: '1' | '3' | '5' | '15' | '30' | '60' | '240' | 'D';
  theme?: 'light' | 'dark';
  autosize?: boolean;
  height?: number;
};

export default function TradingViewWidget({
  symbol,
  interval = '1',
  theme = 'dark',
  autosize = true,
  height = 560,
}: Props) {
  const src = useMemo(() => {
    // BINANCE:<PAR> — mantém em sincronia com o símbolo (ex.: BTCUSDT)
    const tvSymbol = `BINANCE:${symbol}`;
    const params = new URLSearchParams({
      symbol: tvSymbol,
      interval,
      theme,
      style: '1',
      timezone: 'Etc/UTC',
      hide_legend: '0',
      hide_side_toolbar: '0',
      hide_top_toolbar: '0',
      withdateranges: '1',
      allow_symbol_change: '1',
      saveimage: '0',
      studies: '[]',
      // deixa o fundo transparente p/ casar com seu tema
      backgroundColor: 'rgba(0,0,0,0)',
      locale: 'br',
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [symbol, interval, theme]);

  return (
    <iframe
      title="TradingView Chart"
      src={src}
      style={{
        width: '100%',
        height: autosize ? '100%' : `${height}px`,
        border: 0,
        borderRadius: 12,
        background: 'transparent',
      }}
      allow="fullscreen"
    />
  );
}
