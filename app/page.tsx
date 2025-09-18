// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const SYMBOLS = ["ADAUSDT","BTCUSDT","ETHUSDT","SOLUSDT","LINKUSDT","BNBUSDT","XRPUSDT","DOGEUSDT"];

type TPrice = { symbol: string; price: number };

async function fetchPrices(): Promise<TPrice[]> {
  const url = "https://api.binance.com/api/v3/ticker/price";
  const r = await fetch(url, { cache: "no-store" });
  const data = (await r.json()) as { symbol: string; price: string }[];
  const map = new Map(data.map((d) => [d.symbol, Number(d.price)]));
  return SYMBOLS.map((s) => ({ symbol: s, price: map.get(s) ?? 0 }));
}

export default function HomePage() {
  const [prices, setPrices] = useState<TPrice[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try { const p = await fetchPrices(); if (alive) setPrices(p); } catch {}
    };
    load();
    const t = setInterval(load, 5000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <main className="homeWrap">
      {/* Strip de moedas (cabe toda sem rolagem) */}
      <section className="marketStrip">
        {SYMBOLS.map((s) => {
          const p = prices.find((x) => x.symbol === s)?.price ?? 0;
          return (
            <div className="marketItem" key={s}>
              <div className="marketSym">{s.replace("USDT","")}/USDT</div>
              <div className="marketPx">{p ? p.toLocaleString("pt-PT") : "—"}</div>
              <div className="marketMuted" />
            </div>
          );
        })}
      </section>

      {/* Hero */}
      <section className="hero">
        <div className="heroCard">
          <div>
            <div className="muted xs" style={{letterSpacing:"1px"}}>SIMULADOR DE TRADING</div>
            <h1 className="heroTitle">Aprenda de verdade sem perder nada.</h1>
            <p className="heroP">
              Um simulador prático para testar estratégias e evoluir sem risco — histórico local no navegador. Fase 1 (site base online).
            </p>
          </div>

          <div className="ctaCol">
            <Link className="btn btn-primary" href="/simulador">Acessar simulador</Link>
            <Link className="btn" href="/sobre">Sobre</Link>
            <Link className="btn" href="/planos">Planos</Link>
            <Link className="btn" href="/fale-com-agente">Fale com a gente</Link>
          </div>
        </div>
      </section>

      <footer className="homeFooter">
        <span>© 2025 RadarCrypto • Fase 1</span>
        <span className="hash">versão: {process.env.NEXT_PUBLIC_BUILD_HASH ?? "dev"}</span>
      </footer>
    </main>
  );
}
