'use client';

import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';

export default function SobrePage() {
  return (
    <main className="panel aboutV2-root">
      {/* Top bar */}
      <div className="aboutV2-top">
        <span className="aboutV2-tag">SOBRE</span>
        <Link href="/" className="btn btn-primary aboutV2-back">Voltar ao início</Link>
      </div>

      {/* Hero */}
      <section className="aboutV2-hero">
        {/* Coluna esquerda: 3 cards empilhados */}
        <div className="aboutV2-cards">
          <article className="aboutV2-card">
            <div className="aboutV2-cardTitle">Errar sem riscos</div>
            <p className="aboutV2-cardText">
              Simulador com <strong>10.000 USDT</strong> virtuais para testar ideias sem
              arriscar dinheiro real.
            </p>
          </article>

          <article className="aboutV2-card">
            <div className="aboutV2-cardTitle">Aprender de verdade</div>
            <p className="aboutV2-cardText">
              Pratique <strong>Spot</strong> e <strong>Futuros</strong> com as mesmas
              noções de risco aplicadas ao dia a dia.
            </p>
          </article>

          <article className="aboutV2-card">
            <div className="aboutV2-cardTitle">Evoluir sempre</div>
            <p className="aboutV2-cardText">
              Ganhe confiança antes de operar no real. Ajuste estratégias e acompanhe sua
              evolução no histórico.
            </p>
          </article>
        </div>

        {/* Centro: título grande + subtítulo */}
        <div className="aboutV2-center">
          <h1 className="aboutV2-title">
            SOBRE O {BRAND_NAME.toUpperCase()}
          </h1>
          <p className="aboutV2-sub">
            {BRAND_NAME} é onde você erra, aprende e evolui. Treine no Spot ou no Futuro
            com saldo virtual e prepare-se para ganhar confiança no mercado real.
          </p>
        </div>

        {/* Direita vazia (para respirar) — o botão de voltar já está na top bar */}
        <div className="aboutV2-right" />
      </section>
    </main>
  );
}
