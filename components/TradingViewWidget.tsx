// components/TradingViewWidget.tsx
"use client";
import { useEffect, useRef } from "react";

type Props = {
  symbol?: string;     // ex.: "BINANCE:BTCUSDT"
  studies?: string[];  // ex.: ["RSI@tv-basicstudies"]
};

export default function TradingViewWidget({
  symbol = "BINANCE:BTCUSDT",
  studies = [],
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const studiesParam = encodeURIComponent(JSON.stringify(studies));

    ref.current.innerHTML = `<iframe
      src="https://s.tradingview.com/widgetembed/?frameElementId=tv_embed
      &symbol=${encodeURIComponent(symbol)}
      &interval=60
      &hidesidetoolbar=0
      &symboledit=1
      &saveimage=0
      &studies=${studiesParam}
      &hideideas=1
      &theme=dark"
      style="width:100%;height:100%;border:0;border-radius:12px"></iframe>`;
  }, [symbol, studies]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}
