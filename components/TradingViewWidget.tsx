// components/TradingViewWidget.tsx
"use client";
import { useEffect, useRef } from "react";

type Props = { symbol?: string }; // ex.: "BINANCE:BTCUSDT"

export default function TradingViewWidget({ symbol = "BINANCE:BTCUSDT" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // limpa iframe anterior
    wrap.innerHTML = "";

    // 🔑 parâmetros corretos para mostrar a BARRA LATERAL:
    // - hide_side_toolbar = "false"   ← mostra as ferramentas (linhas, régua, etc.)
    // - hide_top_toolbar  = "false"   ← mantém a barra superior (intervalos, indicadores)
    const params = new URLSearchParams({
      frameElementId: "tv_embed",
      symbol,
      interval: "60",
      hide_side_toolbar: "false", // ✅ barra lateral visível
      hide_top_toolbar: "false",
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

    return () => { if (wrap.contains(iframe)) wrap.removeChild(iframe); };
  }, [symbol]);

  return <div ref={wrapRef} style={{ width: "100%", height: "100%" }} />;
}
