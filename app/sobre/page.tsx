'use client';

import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';

export default function SobrePage() {
  return (
    <main className="wrapper" style={{ gridTemplateColumns: '1fr', paddingTop: 24 }}>
      <section className="panel" style={{ position: 'relative' }}>
        {/* Título chamativo */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(28px, 5vw, 56px)',
              lineHeight: 1.04,
              fontWeight: 900,
              letterSpacing: '.02em',
              textTransform: 'uppercase',
              background:
                'linear-gradient(90deg,#c9eedc 0%, #1cff80 45%, #7bffc3 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              filter: 'drop-shadow(0 4px 18px rgba(33,243,141,.18))',
            }}
          >
            Sobre o {BRAND_NAME}
          </h1>

          <Link href="/" className="btn btn-primary" style={{ padding: '12px 18px', borderRadius: 12 }}>
            Voltar ao início
          </Link>
        </div>

        {/* Subtítulo curto */}
        <p style={{ marginTop: 0, marginBottom: 20, opacity: 0.9, maxWidth: 900 }}>
          {BRAND_NAME}: onde você erra, aprende e evolui. Treine no Spot ou no Futuro com
          saldo virtual e prepare-se para ganhar confiança no mercado real.
        </p>

        {/* Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(260px, 1fr))',
            gap: 14,
          }}
        >
          {/* Errar sem riscos */}
          <article className="panel" style={{ padding: 16 }}>
            <div style={{ fontWeight: 800, color: '#1cff80', marginBottom: 8 }}>
              Errar sem riscos
            </div>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Simulador com 10.000 USDT virtuais para testar ideias sem expor dinheiro real.
            </p>
          </article>

          {/* Aprender de verdade */}
          <article className="panel" style={{ padding: 16 }}>
            <div style={{ fontWeight: 800, color: '#1cff80', marginBottom: 8 }}>
              Aprender de verdade
            </div>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Pratique Spot e Futuro com as mesmas regras e noções de risco aplicadas ao dia a dia.
            </p>
          </article>

          {/* Evoluir sempre */}
          <article className="panel" style={{ padding: 16 }}>
            <div style={{ fontWeight: 800, color: '#1cff80', marginBottom: 8 }}>
              Evoluir sempre
            </div>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Ganhe confiança antes de operar no real. Ajuste estratégias e acompanhe sua evolução no histórico.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
