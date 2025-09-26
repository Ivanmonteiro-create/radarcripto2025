'use client';

import React, { useEffect, useRef } from 'react';

type Props = {
  /** Ex.: "BINANCE:BTCUSDT" */
  symbol: string;
};

export default function TradingViewWidget({ symbol }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;

    const config = {
      autosize: true,
      symbol,                    // "BINANCE:BTCUSDT"
      interval: '1',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'br',
      hide_legend: false,        // ← volta a mostrar a legenda/símbolos
      enable_publishing: false,
      allow_symbol_change: false,
      save_image: true,
      withdateranges: true,
      // Mantemos os botões padrão; NÃO desabilitamos “indicadores”
      disabled_features: [
        'header_symbol_search',
        'header_compare',
        'header_saveload',
        'header_fullscreen_button', // usamos nosso botão próprio
      ],
      studies: [],
      container_id: 'tv-container',
    };

    script.innerHTML = JSON.stringify(config);
    ref.current.appendChild(script);

    return () => {
      if (ref.current) ref.current.innerHTML = '';
    };
  }, [symbol]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div ref={ref} id="tv-container" style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
