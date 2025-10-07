// app/page.tsx
import LiveTickers from "@/components/LiveTickers";
import HeroRadar from "@/components/HeroRadar";

export default function HomePage() {
  return (
    <div className="rc-home">
      <HeroRadar />
      <LiveTickers />
      <section className="rc-hero" aria-label="Chamada principal">
        <div className="rc-hero__glow" />
        <div className="rc-hero__inner">
          <p className="rc-hero__eyebrow">SIMULADOR DE TRADING</p>
          <h1 className="rc-hero__title">Aprenda trading na prática, sem arriscar um centavo.</h1>
          <p className="rc-hero__desc">
            Pratique com saldo virtual e evolua sem risco — histórico local no navegador.
            <span className="rc-hero__phase"> Fase 1 (site base online)</span>
          </p>
        </div>
      </section>
    </div>
  );
}
