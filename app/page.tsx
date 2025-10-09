// app/page.tsx
import LiveTickers from "@/components/LiveTickers";
import "./home-tweaks.css"; // <-- overrides só da Home, vem depois do globals.css

export default function HomePage() {
  return (
    <div className="rc-home" data-page="home">
      {/* wrapper para garantir seletor estável */}
      <div className="rc-tickers-wrap">
        <LiveTickers />
      </div>

      <section className="rc-hero" aria-label="Chamada principal">
        <div className="rc-hero__frame">
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
        </div>
      </section>
    </div>
  );
}
