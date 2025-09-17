// app/page.tsx
import Navbar from "@/components/Navbar";
import LiveTickers from "@/components/LiveTickers";

export default function HomePage() {
  return (
    <main className="wrapper">
      {/* Esquerda: tickers ao vivo */}
      <section className="panel leftPanel">
        <LiveTickers />
      </section>

      {/* Centro: hero */}
      <section className="panel hero">
        <div className="heroInner">
          <div className="heroTag">SIMULADOR DE TRADING</div>
          <h1 className="heroTitle">Aprenda de verdade sem perder nada.</h1>
          <p className="heroSubtitle">
            Um simulador prático para testar estratégias e evoluir sem risco —
            histórico local no navegador. Em construção: Fase 1 (site base
            online).
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
