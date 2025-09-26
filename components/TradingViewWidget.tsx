// components/TradingViewWidget.tsx
"use client";

import React, { useMemo } from "react";

type Props = {
  /** Ex.: "BTCUSDT" (sem o "BINANCE:"; eu adiciono) */
  symbol: string;
  interval?: string; // "1" | "3" | "5" | "15" | "60" | "240" | "D" | "W"
  theme?: "light" | "dark";
  autosize?: boolean;
  height?: number;
};

export default function TradingViewWidget({
  symbol,
  interval = "1",
  theme = "dark",
  autosize = true,
  height = 560,
}: Props) {
  const src = useMemo(() => {
    const p = new URLSearchParams({
      symbol: `BINANCE:${symbol}`,
      interval,
      theme,
      style: "1",
      locale: "br",
      hide_side_toolbar: "0",
      hide_top_toolbar: "0",
      allow_symbol_change: "1",
      withdateranges: "1",
      studies: "",
      support_host: "https://www.tradingview.com",
    });
    return `https://s.tradingview.com/widgetembed/?${p.toString()}`;
  }, [symbol, interval, theme]);

  return (
    <div style={{ width: "100%", height: autosize ? "100%" : height }}>
      <iframe
        title={`Gráfico — ${symbol}`}
        src={src}
        style={{ width: "100%", height: "100%", border: 0, borderRadius: 12, background: "transparent" }}
        allowTransparency
        loading="lazy"
      />
    </div>
  );
}
