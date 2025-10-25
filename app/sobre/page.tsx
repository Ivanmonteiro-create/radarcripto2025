// app/sobre/page.tsx
"use client";

import React from "react";

export default function SobrePage() {
  return (
    <main className="page-sobre">
      {/* ---- BOTÃO SUPERIOR DIREITO ---- */}
      <div className="top-button">
        <a href="/" className="rc-btn rc-btn--green">Voltar ao início</a>
      </div>

      {/* ---- HERO / CABEÇALHO ---- */}
      <section className="hero">
        <h1>
          SOBRE O <span>RADARCRYPTO</span>
        </h1>
        <p className="sub">
          Onde o aprendizado encontra a prática — o risco fica de fora. Aqui, você
          aprende trading sem perder <strong>dinheiro real</strong>, dentro de um ambiente
          virtual seguro, moderno e acessível.
        </p>

        {/* ---- PILLS ---- */}
        <div className="pills">
          <div className="pill">+2.000 traders já começaram por aqui</div>
          <div className="pill">Ferramentas de quem vive o mercado</div>
        </div>
      </section>

      {/* ---- CONTEÚDO / CARDS ---- */}
      <section className="cardsWrap">
        <article className="card">
          <div className="cardTitle">
            <span className="icon">🔒</span> Erre sem riscos
          </div>
          <p>
            Teste estratégias no simulador com <strong>10.000 USDT virtuais</strong> e descubra
            como o mercado se comporta — <em>sem arriscar um centavo</em>.
          </p>
        </article>

        <article className="card">
          <div className="cardTitle">
            <span className="icon">🧠</span> Aprenda de verdade
          </div>
          <p>
            Experimente o trading no <strong>Spot</strong> ou <strong>Futuro</strong>, pratique leitura
            de gráficos e desenvolva controle emocional: é escola e prática real.
          </p>
        </article>

        <article className="card">
          <div className="cardTitle">
            <span className="icon">🚀</span> Evolua sempre
          </div>
          <p>
            Revise resultados, teste novas ideias e acompanhe sua performance com
            clareza: quanto mais você pratica, mais se prepara para o mercado real.
          </p>
        </article>
      </section>

      {/* ---- FECHO ---- */}
      <section className="closer">
        <p>
          Treine hoje. Entenda amanhã. <strong>Aja com confiança.</strong>
        </p>
      </section>

      {/* ---- ESTILOS ---- */}
      <style jsx>{`
        .page-sobre {
          --w: min(1200px, 92vw);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 28px 0 64px;
          color: #e6fff5;
          position: relative;
          isolation: isolate;
          background: radial-gradient(
            60% 60% at 50% 45%,
            rgba(24, 226, 115, 0.12),
            transparent 70%
          );
        }

        /* ===== BOTÃO SUPERIOR DIREITO ===== */
        .top-button {
          position: absolute;
          top: 20px;
          right: 30px;
          z-index: 5;
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
          cursor: pointer;
          line-height: 1;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          white-space: nowrap;
        }

        .rc-btn--green {
          background: #18e273;
          color: #052515;
          box-shadow: 0 0 16px rgba(24, 226, 115, 0.8),
            inset 0 0 10px rgba(24, 226, 115, 0.4);
        }

        .rc-btn--green:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 26px rgba(24, 226, 115, 1),
            inset 0 0 12px rgba(24, 226, 115, 0.6);
        }

        /* ===== HERO ===== */
        .hero {
          width: var(--w);
          text-align: center;
          margin-top: 50px;
        }

        .hero h1 {
          font-size: clamp(28px, 4vw, 54px);
          font-weight: 900;
          margin-bottom: 10px;
          text-shadow: 0 0 12px rgba(24, 226, 115, 0.4);
        }

        .hero h1 span {
          color: #18e273;
          text-shadow: 0 0 14px rgba(24, 226, 115, 0.8);
        }

        .hero .sub {
          max-width: 900px;
          margin: 0 auto;
          color: #eafff5;
          font-size: clamp(14px, 1.5vw, 18px);
          line-height: 1.6;
        }

        /* ===== PILLS ===== */
        .pills {
          margin-top: 18px;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .pill {
          border: 1px solid rgba(24, 226, 115, 0.45);
          background: rgba(24, 226, 115, 0.12);
          color: #d9ffe9;
          padding: 10px 14px;
          border-radius: 999px;
          font-weight: 700;
          box-shadow: 0 0 12px rgba(24, 226, 115, 0.25);
        }

        /* ===== CARDS ===== */
        .cardsWrap {
          width: var(--w);
          margin-top: 28px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .card {
          border-radius: 16px;
          padding: 20px 18px 18px;
          background: rgba(12, 28, 20, 0.5);
          border: 1px solid rgba(24, 226, 115, 0.22);
          backdrop-filter: blur(6px);
          box-shadow: inset 0 0 0 1px rgba(24, 226, 115, 0.08),
            0 12px 30px rgba(0, 0, 0, 0.4);
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }

        .card:hover {
          transform: translateY(-2px);
          background: rgba(16, 38, 28, 0.65);
          box-shadow: 0 0 20px rgba(24, 226, 115, 0.25);
        }

        .cardTitle {
          font-weight: 900;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 17px;
          color: #18e273;
        }

        .card p {
          margin: 0;
          line-height: 1.55;
        }

        /* ===== FECHO ===== */
        .closer {
          width: var(--w);
          text-align: center;
          margin-top: 24px;
        }

        .closer p {
          font-size: clamp(16px, 2vw, 20px);
          font-weight: 800;
          color: #dcffef;
          text-shadow: 0 0 10px rgba(24, 226, 115, 0.4);
        }

        /* ===== RESPONSIVO ===== */
        @media (max-width: 960px) {
          .cardsWrap {
            grid-template-columns: 1fr;
          }
          .top-button {
            position: static;
            margin: 0 auto 10px;
            display: flex;
            justify-content: flex-end;
            width: var(--w);
          }
          .hero {
            margin-top: 10px;
          }
        }
      `}</style>
    </main>
  );
}
