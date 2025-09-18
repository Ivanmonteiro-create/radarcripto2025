/* app/page.tsx — HOME alinhada ao globals.css */
import Link from 'next/link';

const tickers = [
  { sym: 'ADA/USDT', px: '0,9875' },
  { sym: 'BTC/USDT', px: '117.228,80' },
  { sym: 'ETH/USDT', px: '6.840,90' },
  { sym: 'SOL/USDT', px: '234,55' },
  { sym: 'LINK/USDT', px: '24,12' },
  { sym: 'BNB/USDT', px: '590,81' },
  { sym: 'XRP/USDT', px: '3,1021' },
  { sym: 'DOGE/USDT', px: '0,27689' },
];

export default function HomePage() {
  return (
    <main className="wrapper">
      {/* COLUNA ESQUERDA: Tickers */}
      <aside className="leftPanel">
        <div className="panel">
          <div className="tickers">
            {tickers.map((t) => (
              <div key={t.sym} className="tickerCard">
                <div className="tickerSymbol strong">{t.sym}</div>
                <div className="tickerPrice green">{t.px}</div>
              </div>
            ))}
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
              Um simulador prático para testar estratégias e evoluir sem risco — histórico local no navegador. Em construção: Fase 1 (site base online).
            </p>

            {/* Linha Viva */}
            <div className="liveLineWrap">
              <div className="liveLine" />
              <div className="liveDot" />
            </div>

            {/* CTA/Links (mesma estrutura que você já tinha na Home) */}
            <div style={{ marginTop: 18, display: 'grid', gap: 10, maxWidth: 320, marginInline: 'auto' }}>
              <Link href="/simulador" className="menuBtn active">Acessar simulador</Link>
              <Link href="/sobre" className="menuBtn">Sobre</Link>
              <Link href="/planos" className="menuBtn">Planos</Link>
              <Link href="/fale-com-agente" className="menuBtn">Fale com a gente</Link>
            </div>
          </div>
        </div>
      </section>

      {/* COLUNA DIREITA: Menu (mesmo visual) */}
      <aside className="rightMenu">
        <div className="panel">
          <nav className="menuList">
            <Link href="/" className="menuBtn active">Início</Link>
            <Link href="/sobre" className="menuBtn">Sobre</Link>
            <Link href="/planos" className="menuBtn">Planos</Link>
            <Link href="/simulador" className="menuBtn">Acessar simulador</Link>
            <Link href="/fale-com-agente" className="menuBtn">Fale com a gente</Link>
          </nav>
        </div>
      </aside>
    </main>
  );
}
