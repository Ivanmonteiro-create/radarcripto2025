'use client';

import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';

export default function SobrePage() {
  return (
    <main className="panel aboutClassic">
      <header className="aboutTop">
        <span className="aboutKicker">SOBRE</span>
        <Link href="/" className="btn btn-primary aboutBackBtn">Voltar ao início</Link>
      </header>

      <div className="aboutHead">
        <h1 className="aboutTitle">SOBRE O {BRAND_NAME.toUpperCase()}</h1>
        <p className="aboutSubtitle">
          {BRAND_NAME} é onde você erra, aprende e evolui. Treine no Spot ou no Futuro
          com saldo virtual e prepare-se para ganhar confiança no mercado real.
        </p>
      </div>

      <section className="aboutGrid">
        <article className="aboutCard">
          <div className="aboutCardTitle">Errar sem riscos</div>
          <p className="aboutCardText">
            Simulador com <strong>10.000 USDT</strong> virtuais para testar ideias
            sem arriscar dinheiro real.
          </p>
        </article>

        <article className="aboutCard">
          <div className="aboutCardTitle">Aprender de verdade</div>
          <p className="aboutCardText">
            Pratique <strong>Spot</strong> e <strong>Futuros</strong> com as mesmas
            regras e noções de risco aplicadas ao dia a dia.
          </p>
        </article>

        <article className="aboutCard">
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
