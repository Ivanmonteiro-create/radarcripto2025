// app/page.tsx  (HOME)
// app/page.tsx
import LiveTickers from "@/components/LiveTickers";

export default function HomePage() {
  return (
    <div className="rc-home">
      {/* radar de fundo */}
      <div className="rc-radar" aria-hidden />

      {/* coluna de tickers (uma coluna; preço embaixo do símbolo) */}
      <LiveTickers />

      {/* bloco hero – sem botões laterais/abaixo */}
      <section className="rc-hero" aria-label="Chamada principal">
        <div className="rc-hero__glow" />
        <div className="rc-hero__inner">
          <p className="rc-hero__eyebrow">SIMULADOR DE TRADING</p>
          <h1 className="rc-hero__title">
            Aprenda trading na prática, sem arriscar um centavo.
          </h1>
          <h1 className="rc-hero__title">Aprenda trading na prática, sem arriscar um centavo.</h1>
          <p className="rc-hero__desc">
            Pratique com saldo virtual e evolua sem risco — histórico local no
            navegador. <span className="rc-hero__phase">Fase 1 (site base online)</span>
            Pratique com saldo virtual e evolua sem risco — histórico local no navegador.
            <span className="rc-hero__phase"> Fase 1 (site base online)</span>
          </p>
        </div>
      </section>
