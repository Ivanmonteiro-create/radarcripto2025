// app/page.tsx
import LiveTickers from "@/components/LiveTickers";

export default function HomePage() {
  return (
    <div className="rc-home">
      {/* TICKERS NO TOPO */}
      <div className="rc-tickers">
        <LiveTickers />
      </div>

      {/* RADAR ANIMADO DE FUNDO */}
      <div className="rc-radar" aria-hidden />

      {/* HERO MAIS ENXUTO (cabe no zoom 100% com respiro à direita) */}
      <section className="rc-hero" aria-label="Chamada principal">
        <div className="rc-hero__glow" />
        <div className="rc-hero__inner">
          <p className="rc-hero__eyebrow">SIMULADOR DE TRADING</p>
          <h1 className="rc-hero__title">
            Aprenda trading na prática, sem arriscar um centavo.
          </h1>
          <p className="rc-hero__desc">
            Pratique com saldo virtual e evolua sem risco — histórico local no navegador.
            <span className="rc-hero__phase"> Fase 1 (site base online)</span>
          </p>
        </div>
      </section>
    </div>
  );
}
