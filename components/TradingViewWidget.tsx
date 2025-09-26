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
      symbol,                  // ex.: "BINANCE:BTCUSDT"
      interval: '1',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'br',

      /* >>> GARANTE AS BARRAS/INDICADORES VISÍVEIS <<< */
      hide_top_toolbar: false,
      hide_side_toolbar: false,   // ← barra lateral (desenhos/ícones)
      hide_legend: false,         // ← mantém legenda/símbolos
      studies: [],

      /* Não usamos o botão nativo de FS: teremos nosso botão próprio */
      disabled_features: [
        'header_symbol_search',
        'header_compare',
        'header_saveload',
        'header_fullscreen_button',
      ],

      allow_symbol_change: false,
      enable_publishing: false,
      save_image: true,
      withdateranges: true,
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
