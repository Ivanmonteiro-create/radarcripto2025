// app/page.tsx
import Navbar from "@/components/Navbar";
import TickerCard from "@/components/TickerCard";

export default function HomePage() {
  return (
    <main className="wrapper">
      {/* Esquerda: tickers */}
      <section className="panel leftPanel">
        <div className="tickers">
          <TickerCard symbol="ADA/USDT"  price="0,85729"   delta="+0,42%" />
          <TickerCard symbol="BTC/USDT"  price="116.283,60" delta="+1,02%" />
          <TickerCard symbol="ETH/USDT"  price="4.950,70"   delta="+0,35%" />
          <TickerCard symbol="SOL/USDT"  price="284,27"     delta="+0,91%" />
          <TickerCard symbol="LINK/USDT" price="30,07"      delta="-0,12%" />
          <TickerCard symbol="BNB/USDT"  price="835,00"     delta="+0,66%" />
          <TickerCard symbol="XRP/USDT"  price="2,3170"     delta="+0,08%" />
          <TickerCard symbol="DOGE/USDT" price="0,36528"    delta="-0,21%" />
        </div>
      </section>

      {/* Centro: hero */}
      <section className="panel hero">
        <div className="heroInner">
          <div className="heroTag">SIMULADOR DE TRADING</div>
          <h1 className="heroTitle">Aprenda de verdade sem perder nada.</h1>
          <p className="heroSubtitle">
            Um simulador prático para testar estratégias e evoluir sem risco — histórico local no navegador.
            Em construção: Fase 1 (site base online).
          </p>

          <div className="liveLineWrap" aria-hidden>
            <div className="liveLine"></div>
            <div className="liveDot"></div>
          </div>
          <p className="small muted">Linha viva — efeito visual</p>
        </div>
      </section>

      {/* Direita: menu */}
      <Navbar />
    </main>
  );
}
