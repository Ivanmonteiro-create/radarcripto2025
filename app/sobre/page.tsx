// app/sobre/page.tsx
"use client";

import React from "react";

export default function SobrePage() {
  return (
    <main className="page-sobre">
      {/* ---- ESTILOS GLOBAIS SÓ PARA ESTA PÁGINA ---- */}
      <style jsx global>{`
        /* Botão padrão verde fluorescente (mesma identidade do site) */
        .rc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          padding: 0 18px;
          border: 0;
          border-radius: 999px;
          font-weight: 800;
          text-decoration: none;
          line-height: 1;
          cursor: pointer;
          transition: transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease;
          white-space: nowrap;
        }
        .rc-btn--green {
          background: #18e273 !important;
          color: #052515 !important;
          box-shadow: 0 0 18px rgba(24, 226, 115, 0.8),
            inset 0 0 10px rgba(24, 226, 115, 0.5);
        }
        .rc-btn--green:hover {
          transform: translateY(-1px);
          filter: brightness(1.15);
          box-shadow: 0 0 28px rgba(24, 226, 115, 1),
            inset 0 0 16px rgba(24, 226, 115, 0.7);
        }
      `}</style>

      {/* ---- HERO / CABEÇALHO ---- */}
      <section className="hero">
        {/* Botão fixo do lado direito (dentro do hero) */}
        <div className="backTopRight">
          <a href="/" className="rc-btn rc-btn--green" aria-label="Voltar ao início">
            Voltar ao início
          </a>
        </div>

        <h1>SOBRE O <span>RADARCRYPTO</span></h1>
        <p className="sub">
          Onde o aprendizado encontra a prática — o risco fica de fora. Aqui, você
          aprende trading sem perder <strong>dinheiro real</strong>, dentro de um ambiente
          virtual seguro, moderno e acessível.
        </p>

        {/* Sinais de prova social / autoridade (apenas 2 pills) */}
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
        <p>Treine hoje. Entenda amanhã. <strong>Aja com confiança.</strong></p>
      </section>

      {/* ---- ESTILOS LOCAIS ---- */}
      <style jsx>{`
        .page-sobre {
          --w: min(1200px, 92vw);
          --gap: clamp(12px, 2vw, 20px);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 28px 0 64px;
          color: #e6fff5;
          position: relative;
          isolation: isolate;
        }

        /* Radar / fundo sutil via gradient, sem imagem externa */
        .page-sobre::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(60% 60% at 55% 45%, rgba(24, 226, 115, 0.18), transparent 60%),
            radial-gradient(35% 35% at 65% 35%, rgba(24, 226, 115, 0.12), transparent 60%);
          filter: blur(2px);
          z-index: -1;
        }

        .hero {
          width: var(--w);
          text-align: center;
          margin-bottom: 10px;
          position: relative;
        }

        .backTopRight {
          position: absolute;
          top: 0;
          right: 0;
        }

        .hero h1 {
          font-size: clamp(28px, 4.4vw, 54px);
          font-weight: 900;
          letter-spacing: 0.2px;
          margin: 0 0 8px 0;
          text-shadow: 0 0 10px rgba(24, 226, 115, 0.45);
        }
        .hero h1 span {
          color: #18e273;
          text-shadow: 0 0 10px rgba(24, 226, 115, 0.8);
        }

        .hero .sub {
          max-width: 900px;
          margin: 0 auto;
          opacity: 0.92;
          color: #eafff5;
          font-size: clamp(14px, 1.6vw, 18px);
          line-height: 1.6;
        }

        .pills {
          margin: 16px auto 0;
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          max-width: 900px;
        }
        .pill {
          border: 1px solid rgba(24, 226, 115, 0.45);
          background: rgba(24, 226, 115, 0.12);
          color: #d9ffe9;
          padding: 10px 14px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 0 12px rgba(24, 226, 115, 0.35);
        }

        .cardsWrap {
          width: var(--w);
          margin-top: 18px; /* aproxima dos textos, sem encostar */
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--gap);
        }

        .card {
          position: relative;
          border-radius: 16px;
          padding: 18px 18px 16px;
          background: rgba(12, 28, 20, 0.5);
          border: 1px solid rgba(24, 226, 115, 0.22);
          box-shadow: inset 0 0 0 1px rgba(24, 226, 115, 0.08),
            0 12px 40px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(6px);
          transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
          min-height: 164px;
        }
        .card:hover {
          transform: translateY(-2px);
          background: rgba(16, 38, 28, 0.66);
          box-shadow: 0 0 22px rgba(24, 226, 115, 0.28),
            inset 0 0 0 1px rgba(24, 226, 115, 0.35);
        }

        .cardTitle {
          font-weight: 900;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 17px;
        }
        .icon {
          font-size: 18px;
        }
        .card p {
          margin: 0;
          opacity: 0.96;
          line-height: 1.55;
        }

        .closer {
          width: var(--w);
          text-align: center;
          margin-top: 18px;
        }
        .closer p {
          font-size: clamp(16px, 2vw, 20px);
          font-weight: 800;
          color: #dcffef;
          text-shadow: 0 0 10px rgba(24, 226, 115, 0.35);
          margin: 0;
        }

        @media (max-width: 960px) {
          .cardsWrap {
            grid-template-columns: 1fr;
          }
          .backTopRight {
            position: static;
            margin-bottom: 10px;
            display: flex;
            justify-content: flex-end;
          }
          .hero {
            text-align: left;
          }
          .hero .sub,
          .pills {
            justify-content: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
