// components/TradingViewEmbedWidget.tsx
"use client";

import React, { useMemo } from "react";

type Props = {
  symbol: string;              // ex: "BTCUSDT"
  interval?: "1" | "3" | "5" | "15" | "30" | "60" | "120" | "240" | "D";
  theme?: "light" | "dark";
  autosize?: boolean;
  height?: number;             // fallback caso não use autosize
};

/**
 * Iframe oficial do TradingView (embed). Não depende de window na importação,
 * portanto funciona bem em Client Components sem mexer no SSR da page.
 */
export default function TradingViewEmbedWidget({
  symbol,
  interval = "1",
  theme = "dark",
  autosize = true,
  height = 560,
}: Props) {
  // BINANCE:<PAR> — mantém alinhado com os prints
  const tvSymbol = useMemo(() => `BINANCE:${symbol}`, [symbol]);

  // URL do embed
  const src = useMemo(() => {
    const params = new URLSearchParams({
      symbol: tvSymbol,
      interval,
      theme,
      style: "1",
      locale: "br",
      hide_legend: "0",
      hide_side_toolbar: "0",
      allow_symbol_change: "1",
      save_image: "0",
      hide_top_toolbar: "0",
      calendar: "0",
      backgroundColor: "rgba(0,0,0,0)", // transparente: casa com o painel
      studies: "", // sem indicadores por padrão
      // autosize controla via CSS; ainda assim mantemos dimensões
      width: autosize ? "100%" : "1000",
      height: autosize ? "100%" : String(height),
      utm_source: "radarcrypto.space",
      utm_medium: "widget",
      utm_campaign: "chart",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [tvSymbol, interval, theme, autosize, height]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: autosize ? height : height, // altura padrão do card
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <iframe
        title={`TradingView ${tvSymbol}`}
        src={src}
        style={{
          width: "100%",
          height: "100%",
          border: "0",
        }}
        referrerPolicy="origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
