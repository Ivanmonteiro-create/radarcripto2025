// app/page.tsx
import Link from "next/link";
import LiveTickers from "@/components/LiveTickers";

export default function HomePage() {
  return (
    <div className="rc-home relative">
      {/* Tickers em cards (sua coluna/grade atual) */}
      <LiveTickers />

      {/* Bloco HERO principal */}
      <section
        className="rc-hero home-hero relative"
        aria-label="Apresentação e acesso rápido"
      >
        {/* Painel de conteúdo à esquerda */}
        <div className="rc-hero__inner">
          <p className="rc-hero__eyebrow">SIMULADOR DE TRADING</p>

          <h1 className="rc-hero__title">
            Aprenda trading na prática, sem arriscar um centavo.
          </h1>

          <p className="rc-hero__desc">
            Pratique com saldo virtual e evolua sem risco — histórico local no
            navegador. <span className="rc-hero__phase">Fase 1 (site base online)</span>
          </p>

          {/* Ações do HERO */}
          <div className="rc-hero__actions grid grid-cols-[auto_auto] gap-2 mt-2">
            <Link href="/simulador" className="rc-btn rc-btn--green">
              Acessar simulador
            </Link>
            <Link href="/robos" className="rc-btn">
              Robôs (SIM)
            </Link>
          </div>
        </div>

        <div className="rc-hero__actions">
          <Link href="/simulador" className="rc-btn rc-btn--green">
            Acessar simulador
          </Link>
          <Link href="/robos" className="rc-btn">
            Robôs (SIM)
          </Link>
          <Link href="/planos" className="rc-btn">Planos</Link>
          <Link href="/sobre" className="rc-btn">Sobre</Link>
          <Link href="/fale-com-agente" className="rc-btn">
            Fale com a gente
          </Link>
        </div>

        {/* brilho/borda interna do hero */}
        <div className="rc-hero__glow" />
      </section>

      {/* Rodapé da Home (© 2025…) se você já tem, pode remover esta duplicação */}
      <footer className="rc-home__footer">
        © 2025 RadarCrypto — Fase 1
      </footer>
    </div>
  );
}
