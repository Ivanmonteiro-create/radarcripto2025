// components/TradingViewWidget.tsx
"use client";
import { useEffect, useRef } from "react";

type Props = { symbol?: string };

export default function TradingViewWidget({ symbol = "BINANCE:BTCUSDT" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = `<iframe
      src="https://s.tradingview.com/widgetembed/?frameElementId=tv_embed
      &symbol=${encodeURIComponent(symbol)}
      &interval=60
      &hidesidetoolbar=0
      &symboledit=1
      &saveimage=0
      &hideideas=1
      &theme=dark"
      style="width:100%;height:100%;border:0;border-radius:12px"></iframe>`;
  }, [symbol]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}
