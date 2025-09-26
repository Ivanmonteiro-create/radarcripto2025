// components/TradingViewWidget.tsx
"use client";

/**
 * Widget IFRAME oficial do TradingView.
 * Mantém o visual e comportamento do seu projeto anterior.
 * Não usa next/dynamic aqui; é 100% client component.
 */
import { useMemo } from "react";

type Props = {
  symbol: string;             // ex.: "BTCUSDT"
  interval?: "1" | "3" | "5" | "15" | "30" | "60";
  theme?: "dark" | "light";
  height?: number;
  autosize?: boolean;
};

export default function TradingViewWidget({
  symbol,
  interval = "1",
  theme = "dark",
  height = 520,
  autosize = false,
}: Props) {
  const src = useMemo(() => {
    // Iframe embed oficial do TradingView (lightweight chart)
    const params = new URLSearchParams({
      symbol: `BINANCE:${symbol}`,
      interval,
      theme,
      style: "1",
      locale: "br",
      hide_top_toolbar: "0",
      hide_legend: "0",
      withdateranges: "1",
      saveimage: "0",
      studies: "",
      enable_publishing: "0",
      allow_symbol_change: "1",
      calendar: "0",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [symbol, interval, theme]);

  return (
    <div style={{ width: "100%", height }}>
      <iframe
        title={`TV-${symbol}`}
        src={src}
        style={{ width: "100%", height: "100%", border: 0, borderRadius: 12 }}
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
      />
    </div>
  );
}
