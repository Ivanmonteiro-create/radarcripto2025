// app/sobre/page.tsx
"use client";

import Link from "next/link";

export default function SobrePage() {
  return (
    <main className="page-sobre">
      {/* Ação fixa no topo à direita */}
      <div className="topbar">
        <Link href="/" className="rc-btn rc-btn--green" aria-label="Voltar ao início">
          Voltar ao início
        </Link>
      </div>

      {/* Cabeçalho */}
      <header className="hero">
        <h1 className="hero__title">SOBRE O RADARCRYPTO</h1>

        <p className="hero__lead">
          Onde o aprendizado encontra a prática — e o risco fica de fora.
        </p>

        <p className="hero__desc">
          O RadarCrypto nasceu com um propósito simples:{" "}
          <strong>ajudar pessoas a aprender trading sem perder dinheiro real</strong>.
          Aqui você erra, aprende, ajusta e evolui — tudo dentro de um
          <strong> ambiente virtual seguro</strong>, moderno e acessível.
        </p>
      </header>

      {/* Trinca de cards */}
      <section className="cards">
        <article className="card">
          <h3 className="card__title">Erre sem riscos</h3>
          <p className="card__text">
            Treine estratégias no simulador com <strong>10.000 USDT virtuais</strong> e
            descubra como o mercado se comporta — <strong>sem arriscar um centavo</strong>.
          </p>
        </article>

        <article className="card">
          <h3 className="card__title">Aprenda de verdade</h3>
          <p className="card__text">
            Experimente operações no <strong>Spot</strong> ou <strong>Futuro</strong>, pratique
            leitura de gráficos e desenvolva controle emocional — é
            <strong> escola de prática real</strong>.
          </p>
        </article>

        <article className="card">
          <h3 className="card__title">Evolua sempre</h3>
          <p className="card__text">
            Revise seus resultados, teste novas ideias e acompanhe sua performance com clareza.
            Quanto mais você pratica, mais se prepara para o mercado real.
          </p>
        </article>
      </section>

      {/* Selo de prova social (rodapé da seção) */}
      <section className="footnote">
        <p>+2.000 traders já começaram por aqui.</p>
      </section>

      {/* -------- ESTILOS LOCAIS -------- */}
      <style jsx>{`
        :root {
          --rc-green: #18e273;
          --rc-green-ink: #052515;
          --rc-ink: #e9fff5;
          --rc-ink-dim: #c9f7df;
          --rc-panel: rgba(8, 24, 16, 0.45);
          --rc-panel-strong: rgba(8, 24, 16, 0.6);
          --rc-stroke: rgba(24, 226, 115, 0.35);
          --rc-glow: 0 0 18px rgba(24, 226, 115, 0.8);
        }

        .page-sobre {
          min-height: 100vh;
          width: 100%;
          background: #070b0a;
          color: var(--rc-ink);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 28px 18px 64px;
        }

        /* Topbar com botão */
        .topbar {
          width: min(1120px, 96vw);
          display: flex;
          justify-content: flex-end;
        }

        .rc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          padding: 0 18px;
          border-radius: 999px;
          font-weight: 800;
          text-decoration: none;
          line-height: 1;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .rc-btn--green {
          background: var(--rc-green) !important;
          color: var(--rc-green-ink) !important;
          box-shadow: var(--rc-glow), inset 0 0 10px rgba(24, 226, 115, 0.5);
        }
        .rc-btn--green:hover {
          filter: brightness(1.35);
          transform: translateY(-2px);
          box-shadow: 0 0 28px rgba(24, 226, 115, 1),
            inset 0 0 16px rgba(24, 226, 115, 0.7);
        }

        /* Hero */
        .hero {
          width: min(1120px, 96vw);
          text-align: center;
          margin-top: 10px;
        }
        .hero__title {
          font-size: clamp(28px, 3.2vw, 44px);
          font-weight: 900;
          letter-spacing: 0.2px;
          text-transform: uppercase;
          color: var(--rc-green);
        }
        .hero__lead {
          margin-top: 6px;
          color: var(--rc-ink-dim);
          font-size: clamp(15px, 1.4vw, 18px);
        }
        .hero__desc {
          margin: 12px auto 0;
          max-width: 860px;
          color: #d9fbe9;
          line-height: 1.6;
        }

        /* Cards */
        .cards {
          width: min(1120px, 96vw);
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .card {
          border: 1px solid var(--rc-stroke);
          background: var(--rc-panel);
          border-radius: 18px;
          padding: 18px;
          box-shadow: inset 0 0 0 1px rgba(24, 226, 115, 0.1);
          transition: background 160ms ease, box-shadow 160ms ease, transform 160ms ease;
        }
        .card:hover {
          background: var(--rc-panel-strong);
          box-shadow: 0 0 22px rgba(24, 226, 115, 0.4);
          transform: translateY(-2px);
        }
        .card__title {
          color: var(--rc-green);
          font-weight: 800;
          font-size: clamp(18px, 1.8vw, 20px);
          margin-bottom: 8px;
        }
        .card__text {
          color: #d9fbe9;
          line-height: 1.55;
        }

        /* Nota final */
        .footnote {
          width: min(1120px, 96vw);
          text-align: center;
          margin-top: 18px;
          color: var(--rc-green);
          font-weight: 700;
        }

        /* Responsivo */
        @media (max-width: 980px) {
          .cards {
            grid-template-columns: 1fr;
          }
          .hero__desc {
            max-width: 720px;
          }
        }
      `}</style>
    </main>
  );
}
