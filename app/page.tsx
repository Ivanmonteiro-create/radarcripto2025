/* app/page.tsx — HOME (client, preços ao vivo) */
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type TSymbol = 'ADAUSDT' | 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT' | 'LINKUSDT' | 'BNBUSDT' | 'XRPUSDT' | 'DOGEUSDT';
type TItem = { sym: TSymbol; label: string };

const LIST: TItem[] = [
  { sym: 'ADAUSDT',  label: 'ADA/USDT'  },
  { sym: 'BTCUSDT',  label: 'BTC/USDT'  },
  { sym: 'ETHUSDT',  label: 'ETH/USDT'  },
  { sym: 'SOLUSDT',  label: 'SOL/USDT'  },
  { sym: 'LINKUSDT', label: 'LINK/USDT' },
  { sym: 'BNBUSDT',  label: 'BNB/USDT'  },
  { sym: 'XRPUSDT',  label: 'XRP/USDT'  },
  { sym: 'DOGEUSDT', label: 'DOGE/USDT' },
];

export default function HomePage() {
  const [prices, setPrices] = useState<Record<TSymbol, string>>({} as any);

  const symbolsParam = useMemo(
    () => encodeURIComponent(JSON.stringify(LIST.map(l => l.sym))),
    []
  );

  useEffect(() => {
    let stop = false;

    const load = async () => {
      try {
        const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${symbolsParam}`, { cache: 'no-store' });
        const data: Array<{ symbol: TSymbol; price: string }> = await r.json();
        if (stop) return;
        const map: Record<TSymbol, string> = {} as any;
        data.forEach(d => { map[d.symbol] = d.price; });
        setPrices(map);
      } catch (_) {
        // silencioso
      }
    };

    load();
    const id = setInterval(load, 5000); // ~5s
    return () => { stop = true; clearInterval(id); };
  }, [symbolsParam]);

  return (
    <main className="wrapper">
      {/* COLUNA ESQUERDA: Tickers — 8 cartões SEMPRE visíveis */}
      <aside className="leftPanel">
        <div className="panel" style={{ height: 'calc(100vh - 32px)' }}>
          <div
            className="tickers"
            style={{
              display: 'grid',
              gridTemplateRows: 'repeat(8, 1fr)',
              gap: 8,
              height: '100%',
            }}
          >
            {LIST.map((t) => {
              const raw = prices[t.sym];
              const value = raw ? Number(raw) : undefined;

              // formatação simples (BR)
              const text =
                value === undefined
                  ? '—'
                  : value >= 1000
                  ? value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
                  : value.toLocaleString('pt-BR', { maximumFractionDigits: 6 });

              return (
                <div
                  key={t.sym}
                  className="tickerCard"
                  style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                >
                  <div className="tickerSymbol strong" style={{ fontSize: 14 }}>{t.label}</div>
                  <div className="tickerPrice green" style={{ fontSize: 16 }}>{text}</div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* COLUNA CENTRAL: Hero + Linha Viva */}
      <section className="panel">
        <div className="hero">
          <div className="heroInner">
            <div className="heroTag">SIMULADOR DE TRADING</div>
            <h1 className="heroTitle">Aprenda de verdade sem perder nada.</h1>
            <p className="heroSubtitle">
              Um simulador prático para testar estratégias e evoluir sem risco — histórico local no navegador.
              Em construção: Fase 1 (site base online).
            </p>

            {/* Linha Viva */}
            <div className="liveLineWrap">
              <div className="liveLine" />
              <div className="liveDot" />
            </div>
          </div>
        </div>
      </section>

      {/* COLUNA DIREITA: Menu — “Acessar simulador” ativo/verde */}
      <aside className="rightMenu">
        <div className="panel">
          <nav className="menuList">
            <Link href="/" className="menuBtn">Início</Link>
            <Link href="/sobre" className="menuBtn">Sobre</Link>
            <Link href="/planos" className="menuBtn">Planos</Link>
            <Link href="/simulador" className="menuBtn active">Acessar simulador</Link>
            <Link href="/fale-com-agente" className="menuBtn">Fale com a gente</Link>
          </nav>
        </div>
      </aside>
    </main>
  );
}
