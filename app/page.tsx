/* app/page.tsx — HOME */
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
      {/* COLUNA ESQUERDA: Tickers – 8 itens SEMPRE visíveis no 100% */}
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
            {tickers.map((t) => (
              <div
                key={t.sym}
                className="tickerCard"
                style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
              >
                <div className="tickerSymbol strong" style={{ fontSize: 14 }}>{t.sym}</div>
                <div className="tickerPrice green" style={{ fontSize: 16 }}>{t.px}</div>
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
