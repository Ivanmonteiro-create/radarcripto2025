'use client';

import React, { useEffect, useRef } from 'react';

type Props = {
  symbol: string;                    // ex: "BTCUSDT"
  interval?: '1' | '3' | '5' | '15' | '30' | '60' | '120' | '240' | 'D' | 'W';
  theme?: 'light' | 'dark';
  autosize?: boolean;
  height?: number;                   // usado se autosize = false
};

/**
 * Iframe oficial do TradingView (embed). Funciona apenas no cliente.
 * Não usa next/dynamic aqui — o próprio componente já é "use client".
 */
export default function TradingViewWidget({
  symbol,
  interval = '1',
  theme = 'dark',
  autosize = true,
  height = 560,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // garante que estamos no browser
    if (typeof window === 'undefined') return;

    // injeta o script do TradingView uma única vez por montagem
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;

    script.onload = () => {
      // @ts-ignore - lib externa no window
      if (window.TradingView && containerRef.current) {
        // limpa container antes de reinicializar
        containerRef.current.innerHTML = '';

        // @ts-ignore
        new window.TradingView.widget({
          symbol: `BINANCE:${symbol}`,
          interval,
          theme,
          locale: 'br',
          container_id: containerRef.current,
          autosize,
          height: autosize ? undefined : height,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          studies: [],
        });
      }
    };

    document.body.appendChild(script);
    return () => {
      // remove o script e o conteúdo do container ao desmontar
      try {
        document.body.removeChild(script);
      } catch {}
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [symbol, interval, theme, autosize, height]);

  return (
    <div
      className="panel"
      style={{
        height: autosize ? '100%' : height,
        minHeight: autosize ? 520 : undefined,
        overflow: 'hidden',
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
