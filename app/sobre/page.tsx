// app/sobre/page.tsx
"use client";

import Link from "next/link";

export default function SobrePage() {
  return (
    <main className="page-sobre" aria-labelledby="sobre-title">
      {/* Radar animado de fundo */}
      <div className="radar" aria-hidden="true" />

      {/* Topbar com botão no canto superior direito */}
      <div className="topbar">
        <Link href="/" className="rc-btn rc-btn--green">Voltar ao início</Link>
      </div>

      {/* Cabeçalho */}
      <header className="hero">
        <h1 id="sobre-title">
          <span>Sobre o</span> RadarCrypto
        </h1>

        <p className="strap">
          Onde o aprendizado encontra a prática — sem arriscar nada.
        </p>

        <div className="stats">
          <div className="pill">+2.000 traders já começaram por aqui</div>
          <div className="pill">100% local e seguro</div>
          <div className="pill">Ferramentas de quem vive o mercado</div>
        </div>
      </header>

      {/* Cards de valor */}
      <section className="cards" aria-label="Por que usar o RadarCrypto">
        <article className="card">
          <h3 className="card__title">Erre sem riscos</h3>
          <p className="card__text">
            Treine estratégias no simulador com <strong>10.000 USDT virtuais</strong> e
            descubra como o mercado se comporta — <strong>sem arriscar um centavo</strong>.
          </p>
          <div className="card__pulse" aria-hidden="true" />
        </article>

        <article className="card">
          <h3 className="card__title">Aprenda de verdade</h3>
          <p className="card__text">
            Experimente operações no <strong>Spot</strong> ou <strong>Futuro</strong>, pratique
            leitura de gráficos e desenvolva controle emocional. É <strong>escola de prática real</strong>.
          </p>
          <div className="card__pulse" aria-hidden="true" />
        </article>

        <article className="card">
          <h3 className="card__title">Evolua sempre</h3>
          <p className="card__text">
            Revise resultados, teste novas ideias e acompanhe performance com clareza.
            Quanto mais pratica, <strong>mais preparado para o mercado real</strong>.
          </p>
          <div className="card__pulse" aria-hidden="true" />
        </article>
      </section>

      {/* Rodapé curtinho da seção */}
      <section className="footnote" aria-hidden="true">
        Treine hoje. Entenda amanhã. Aja com confiança.
      </section>

      {/* ===== ESTILOS LOCAIS ===== */}
      <style jsx>{`
        :root {
          --rc-bg: #070b0a;
          --rc-ink: #eafff5;
          --rc-ink-dim: #c8f3dd;
          --rc-green: #18e273;
          --rc-green-ink: #052515;
          --rc-panel: rgba(8, 24, 16, 0.55);
          --rc-panel-2: rgba(8, 24, 16, 0.75);
          --rc-stroke: rgba(24, 226, 115, 0.42);
          --rc-glow: 0 0 18px rgba(24, 226, 115, 0.75);
        }

        .page-sobre {
          position: relative;
          min-height: 100vh;
          background: var(--rc-bg);
          color: var(--rc-ink);
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
          padding: 24px 16px 72px;
        }

        /* Radar animado de fundo */
        .radar {
          position: absolute;
          inset: -20% -10% -20% -10%;
          background:
            radial-gradient(closest-side, rgba(24,226,115,0.18), transparent 60%),
            radial-gradient(closest-side, rgba(24,226,115,0.10), transparent 70%),
            radial-gradient(closest-side, rgba(24,226,115,0.06), transparent 80%);
          mask:
            radial-gradient(ellipse at center, #000 40%, transparent 70%);
          pointer-events: none;
        }
        .radar::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 160vmax;
          height: 160vmax;
          transform: translate(-50%, -50%);
          background:
            conic-gradient(from 0deg, rgba(24,226,115,0.35), transparent 50%, rgba(24,226,115,0.0) 100%);
          animation: sweep 6s linear infinite;
          filter: blur(6px);
          opacity: 0.65;
        }
        @keyframes sweep {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* Topbar container */
        .topbar {
          width: min(1120px, 96vw);
          display: flex;
          justify-content: flex-end;
          position: relative;
          z-index: 2;
        }

        /* Botão padrão RadarCrypto local (não depende de global) */
        .rc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          padding: 0 18px;
          border-radius: 999px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          text-decoration: none;
          line-height: 1;
          transition: transform .18s ease, filter .18s ease, box-shadow .18s ease;
          white-space: nowrap;
        }
        .rc-btn--green {
          background: var(--rc-green);
          color: var(--rc-green-ink);
          box-shadow: var(--rc-glow), inset 0 0 10px rgba(24, 226, 115, 0.5);
        }
        .rc-btn--green:hover {
          transform: translateY(-2px);
          filter: brightness(1.15);
          box-shadow: 0 0 28px rgba(24, 226, 115, 1), inset 0 0 16px rgba(24,226,115,.7);
        }

        /* Hero */
        .hero {
          width: min(1120px, 96vw);
          text-align: center;
          margin-top: 8px;
          position: relative;
          z-index: 1;
        }
        .hero h1 {
          font-size: clamp(28px, 3.2vw, 44px);
          font-weight: 900;
          letter-spacing: .3px;
          text-transform: uppercase;
          margin: 6px 0 6px 0;
        }
        .hero h1 span {
          font-weight: 700;
          color: var(--rc-ink-dim);
          margin-right: 8px;
        }
        .strap {
          color: var(--rc-ink-dim);
          font-size: clamp(15px, 1.4vw, 18px);
          margin: 4px 0 12px 0;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          width: min(900px, 92vw);
          margin: 0 auto;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid var(--rc-stroke);
          background: rgba(24,226,115,0.12);
          color: #d9ffe9;
          font-weight: 700;
          box-shadow: inset 0 0 0 1px rgba(24,226,115,0.08);
        }

        /* Cards */
        .cards {
          width: min(1120px, 96vw);
          margin-top: 22px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          position: relative;
          z-index: 1;
        }
        .card {
          position: relative;
          border: 1px solid var(--rc-stroke);
          background: var(--rc-panel);
          border-radius: 18px;
          padding: 18px 18px 22px;
          backdrop-filter: blur(2px);
          box-shadow: inset 0 0 0 1px rgba(24,226,115,0.1);
          overflow: hidden;
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
        }
        .card:hover {
          transform: translateY(-3px);
          background: var(--rc-panel-2);
          box-shadow: 0 10px 28px rgba(0,0,0,.35), 0 0 22px rgba(24,226,115,.35);
        }
        .card__title {
          color: var(--rc-green);
          font-weight: 800;
          font-size: clamp(18px, 1.8vw, 20px);
          margin: 0 0 6px 0;
        }
        .card__text {
          color: #d8fbe8;
          line-height: 1.55;
          margin: 0;
        }
        /* Glow pulsante */
        .card__pulse {
          position: absolute;
          inset: -30% -30% auto -30%;
          height: 60%;
          pointer-events: none;
          background: radial-gradient(closest-side, rgba(24,226,115,.18), transparent 70%);
          animation: pulse 2.8s ease-in-out infinite;
          opacity: .65;
        }
        @keyframes pulse {
          0%, 100% { transform: translateY(0) scale(1); opacity: .45; }
          50%      { transform: translateY(-8px) scale(1.04); opacity: .75; }
        }

        .footnote {
          margin-top: 18px;
          color: var(--rc-green);
          font-weight: 700;
          text-align: center;
          width: min(1120px, 96vw);
        }

        /* Responsivo */
        @media (max-width: 980px) {
          .stats { grid-template-columns: 1fr; }
          .cards { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
