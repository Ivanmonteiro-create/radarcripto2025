// app/page.tsx
import LiveTickers from "@/components/LiveTickers";
import HeroRadar from "@/components/HeroRadar";

export default function HomePage() {
  return (
    <div className="rc-home">
      {/* Coluna de moedas */}
      <div className="rc-tickers--leftColumn">
        <LiveTickers />
      </div>

      {/* Radar central, atrás do hero */}
      <HeroRadar />

      {/* Hero */}
      <section className="rc-hero" aria-label="Chamada principal">
        <div className="rc-hero_inner">
          <p className="rc-hero_eyebrow">SIMULADOR DE TRADING</p>
          <h1 className="rc-hero_title">
            Aprenda trading na prática, sem arriscar um centavo.
          </h1>
          <p className="rc-hero_desc">
            Pratique com saldo virtual e evolua sem risco — histórico local no
            navegador.
            <span className="rc-hero_phase">Fase 1 (site base online)</span>
          </p>
        </div>
      </section>
    </div>
  );
}
