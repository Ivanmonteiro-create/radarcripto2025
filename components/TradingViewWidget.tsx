// components/TradingViewWidget.tsx
"use client";

import React, { useMemo } from "react";

type Props = {
  /** Ex.: "BTCUSDT" */
  symbol: string;
  /** "1" | "3" | "5" | "15" | "30" | "60" | "240" | "D" | "W" */
  interval?: string;
  theme?: "light" | "dark";
  autosize?: boolean;
  height?: number; // fallback quando autosize = false
};

export default function TradingViewWidget({
  symbol,
  interval = "1",
  theme = "dark",
  autosize = true,
  height = 560,
}: Props) {
  // Monta a URL do iFrame do widget oficial do TradingView
  const src = useMemo(() => {
    const params = new URLSearchParams({
      symbol: `BINANCE:${symbol}`,
      interval,
      theme,
      style: "1",
      locale: "br",
      hide_top_toolbar: "0",
      hide_legend: "0",
      save_image: "0",
      hide_side_toolbar: "0",
      allow_symbol_change: "1",
      calendar: "0",
      studiess: "",
      support_host: "https://www.tradingview.com",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [symbol, interval, theme]);

  return (
    <div style={{ width: "100%", height: autosize ? "100%" : height }}>
      <iframe
        title={`Gráfico — ${symbol}`}
        src={src}
        style={{
          width: "100%",
          height: "100%",
          border: 0,
          borderRadius: 12,
          background: "transparent",
        }}
        allowTransparency
        loading="lazy"
      />
    </div>
  );
}
