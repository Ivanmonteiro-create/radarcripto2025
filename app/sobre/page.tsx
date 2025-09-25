'use client';

import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';

export default function SobrePage() {
  return (
    <main className="aboutHero panel">
      {/* Faixa superior */}
      <div className="aboutHeroTop">
        <span className="aboutTag">SOBRE</span>
        <Link href="/" className="btn btn-primary aboutBack">Voltar ao início</Link>
      </div>

      {/* Título grande com gradiente (estilo da “segunda foto”) */}
      <header className="aboutHeroHead">
        <h1 className="aboutHeroTitle">SOBRE O {BRAND_NAME.toUpperCase()}</h1>
        <p className="aboutHeroSub">
          {BRAND_NAME} é onde você erra, aprende e evolui. Treine no Spot ou no Futuro
          com saldo virtual e prepare-se para ganhar confiança no mercado real.
        </p>
      </header>

      {/* Três cartões à esquerda (vidro com glow), como no layout antigo */}
      <section className="aboutHeroGrid">
        <article className="aboutCardGlass">
          <div className="aboutCardTitle">Errar sem riscos</div>
          <p className="aboutCardText">
            Simulador com <strong>10.000 USDT</strong> virtuais para testar ideias
            sem arriscar dinheiro real.
          </p>
        </article>

        <article className="aboutCardGlass">
          <div className="aboutCardTitle">Aprender de verdade</div>
          <p className="aboutCardText">
            Pratique <strong>Spot</strong> e <strong>Futuros</strong> com as mesmas
            regras e noções de risco aplicadas ao dia a dia.
          </p>
        </article>

        <article className="aboutCardGlass">
          <div className="aboutCardTitle">Evoluir sempre</div>
          <p className="aboutCardText">
            Ganhe confiança antes de operar no real. Ajuste estratégias e acompanhe
            sua evolução no histórico.
          </p>
        </article>
      </section>
    </main>
  );
}
