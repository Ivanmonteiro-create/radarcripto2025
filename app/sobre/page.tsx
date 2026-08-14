// app/sobre/page.tsx
"use client";

import React from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { pageContent } from "@/lib/i18n/pageContent";

export default function SobrePage() {
  const { locale, t } = useI18n();
  const copy = pageContent[locale].about;
  return (
    <main className="page-sobre">
      {/* ---- HERO / CABEÇALHO ---- */}
      <section className="hero">
        <h1>
          {t("about.title")}
        </h1>
        <p className="sub">
          {copy.subtitle}
        </p>

        {/* ---- PILLS ---- */}
        <div className="pills">
          {copy.pills.map((pill) => <div className="pill" key={pill}>{pill}</div>)}
        </div>
      </section>

      {/* ---- CONTEÚDO / CARDS ---- */}
      <section className="cardsWrap">{copy.cards.map(([icon, title, text]) => <article className="card" key={title}><div className="cardTitle"><span className="icon">{icon}</span>{title}</div><p>{text}</p></article>)}</section>

      {/* ---- FECHO ---- */}
      <section className="closer">
        <p>
          {copy.closer}
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
          .hero {
            margin-top: 10px;
          }
        }
      `}</style>
    </main>
  );
}
