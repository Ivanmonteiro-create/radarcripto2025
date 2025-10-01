'use client';

import Link from 'next/link';
import LiveTickers from '@/components/LiveTickers';
import RadarBackground from '@/components/RadarBackground';

export default function Home() {
  return (
    <main className="rc-home">
      {/* GRID / RADAR de fundo */}
      <RadarBackground />

      {/* Faixa de tickers no topo */}
      <div className="rc-home__tickers">
        <LiveTickers />
      </div>

      {/* Card principal (herói) */}
      <section className="rc-hero">
        <div className="rc-hero__glow" />
        <div className="rc-hero__inner">
          <p className="rc-hero__eyebrow">SIMULADOR DE TRADING</p>
          <h1 className="rc-hero__title">
            Aprenda de verdade <br /> sem perder nada.
          </h1>
          <p className="rc-hero__desc">
            Um simulador prático para testar estratégias e evoluir sem risco —
            histórico local no navegador. <span className="rc-hero__phase">
              Em construção: Fase 1 (site base online).
            </span>
          </p>
        </div>

        {/* A pilha de botões à direita do card */}
        <nav className="rc-hero__actions" aria-label="Ações principais">
          <Link href="/simulador" className="rc-btn rc-btn--green">Acessar simulador</Link>
          <Link href="/planos" className="rc-btn">Planos</Link>
          <Link href="/sobre" className="rc-btn">Sobre</Link>
          <Link href="/" className="rc-btn">Início</Link>
          <Link href="/fale-com-agente" className="rc-btn">Fale com a gente</Link>
        </nav>
      </section>

      {/* Rodapé simples */}
      <footer className="rc-home__footer">
        <small>© 2025 RadarCrypto — Fase 1</small>
      </footer>
    </main>
  );
}
