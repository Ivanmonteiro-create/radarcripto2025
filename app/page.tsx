// app/page.tsx
import LiveTickers from "@/components/LiveTickers";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="rc-home">
      {/* Tickers (coluna ou faixa, conforme seu CSS) */}
      <div className="rc-home__tickers">
        <LiveTickers />
      </div>

      {/* Card do herói */}
      <section className="rc-hero home-hero" aria-labelledby="hero-title">
        <span className="rc-hero__glow" />
        <div className="rc-hero__inner">
          <p className="rc-hero__eyebrow">SIMULADOR DE TRADING</p>
          <h1 id="hero-title" className="rc-hero__title">
            Aprenda trading na prática, sem arriscar um centavo.
          </h1>
          <p className="rc-hero__desc">
            Pratique com saldo virtual e evolua sem risco — histórico local no navegador.{" "}
            <span className="rc-hero__phase">Fase 1 (site base online)</span>
          </p>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="rc-home__footer">© 2025 RadarCrypto — Fase 1</footer>
    </main>
  );
}
