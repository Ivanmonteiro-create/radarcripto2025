// components/TradingViewWidget.tsx
"use client";

import { useEffect, useRef } from "react";

type Props = { symbol?: string }; // Ex.: "BINANCE:BTCUSDT"

export default function TradingViewWidget({ symbol = "BINANCE:BTCUSDT" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // 🔄 Limpa iframe anterior antes de renderizar novo
    wrap.innerHTML = "";

    // 🔑 Parâmetros do widget TradingView
    const params = new URLSearchParams({
      frameElementId: "tv_embed",
      symbol,
      interval: "60",
      hide_side_toolbar: "false", // ✅ mostra barra lateral (ferramentas de desenho)
      hide_top_toolbar: "false",  // ✅ mantém barra superior (intervalos, indicadores)
      allow_symbol_change: "1",
      saveimage: "0",
      hideideas: "1",
      theme: "dark",
      locale: "br",
    });

    const iframe = document.createElement("iframe");
    iframe.src = `https://s.tradingview.com/widgetembed/?${params.toString()}`;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.borderRadius = "12px";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    wrap.appendChild(iframe);

    // 🔙 Cleanup
    return () => {
      if (wrap.contains(iframe)) wrap.removeChild(iframe);
    };
  }, [symbol]);

  return (
    <div
      ref={wrapRef}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
}
