// app/planos/page.tsx
"use client";

import React from "react";

type Plan = {
  slug: "start" | "trader" | "pro" | "elite";
  ribbon: string;
  title: string;
  price: string; // ex: "€ 0,00/mês"
  cta: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    slug: "start",
    ribbon: "PRONTO PARA COMEÇAR",
    title: "Start",
    price: "€ 0,00/mês",
    cta: "Começar de graça",
    features: [
      "Simulador spot básico",
      "Capital virtual de 10.000 USDT",
      "P&L (resultado) e histórico básico",
      "Exportar CSV",
      "8 pares principais habilitados",
      "Gráfico de evolução mensal (equity) · em breve",
    ],
  },
  {
    slug: "trader",
    ribbon: "RECOMENDADO",
    title: "Trader",
    price: "€ 9,99/mês",
    cta: "Quero ser Trader",
    features: [
      "Tudo do plano Start",
      "Robôs automáticos (EMA Cross SIM)",
      "Controle de risco manual (TP/SL)",
      "Histórico expandido (visual e CSV)",
      "Troca rápida entre pares",
      "Painel de performance resumida · em breve",
    ],
  },
  {
    slug: "pro",
    ribbon: "TURBO ACELERADO",
    title: "Pro",
    price: "€ 19,99/mês",
    cta: "Subir para Pro",
    features: [
      "Tudo do plano Trader",
      "Gerenciamento de risco automático",
      "Relatórios filtráveis/detalhados",
      "Estatísticas avançadas (win rate, DD, etc.)",
      "Exportar relatórios detalhados",
      "Notificações de performance · em breve",
    ],
  },
  {
    slug: "elite",
    ribbon: "TUDO DESEBLOQUEADO",
    title: "Elite",
    price: "€ 29,99/mês",
    cta: "Virar Elite",
    features: [
      "Tudo do plano Pro",
      "Backtesting de estratégias",
      "Comparação de estratégias",
      "Histórico mensal/anual salvo (equity curves)",
      "Acesso antecipado a novidades (beta)",
      "Suporte prioritário + comunidade privada",
    ],
  },
];

export default function PlanosPage() {
  return (
    <main className="page-planos">
      {/* GLOBAL FIXES SÓ PARA ESTA PÁGINA */}
      <style jsx global>{`
        /* Esconde qualquer “back to top” preto antigo */
        .rc-backtop,
        .rc-backtop * {
          display: none !important;
        }

        /* Botão padrão verde fluorescente da marca */
        .rc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 40px;
          padding: 0 18px;
          border-radius: 999px;
          font-weight: 800;
          text-decoration: none;
          line-height: 1;
          white-space: nowrap;
          border: none;
          cursor: pointer;
          transition: transform 0.15s ease, filter 0.15s ease,
            box-shadow 0.15s ease;
        }
        .rc-btn--green {
          background: #18e273 !important;
          color: #052515 !important;
          box-shadow: 0 0 18px rgba(24, 226, 115, 0.6),
            inset 0 0 10px rgba(24, 226, 115, 0.35);
        }
        .rc-btn--green:hover {
          transform: translateY(-2px);
          filter: brightness(1.2);
          box-shadow: 0 0 26px rgba(24, 226, 115, 0.9),
            inset 0 0 14px rgba(24, 226, 115, 0.5);
        }
      `}</style>

      {/* CABEÇALHO */}
      <header className="hero">
        <h1>
          Planos do <span>RadarCrypto</span>
        </h1>
        <p className="sub">
          Escolha seu caminho. Comece no SIM (simulador) sem riscos e evolua
          para gráficos, quando quiser, com robôs e ferramentas profissionais.
        </p>

        {/* Micro-provas em chips compactos (apenas 1 linha) */}
        <div className="proofs" role="list">
          <span className="proof" role="listitem">+2.000 traders já testaram</span>
          <span className="proof" role="listitem">100% local e seguro</span>
          <span className="proof" role="listitem">Ferramentas de quem vive o mercado</span>
        </div>

        {/* Botão “Voltar ao início” no topo direito */}
        <div className="backTopRight">
          <a href="/" className="rc-btn rc-btn--green">Voltar ao início</a>
        </div>
      </header>

      {/* GRID DE PLANOS */}
      <section className="plansGrid" aria-label="Planos disponíveis">
        {PLANS.map((p) => (
          <article key={p.slug} className={`plan plan--${p.slug}`} aria-labelledby={`plan-${p.slug}-title`}>
            <div className="plan-head">
              <span className="ribbon">{p.ribbon}</span>
              <h3 id={`plan-${p.slug}-title`}>{p.title}</h3>
              <div className="price">{p.price}</div>
            </div>

            <ul className="featList">
              {p.features.map((f, i) => (
                <li key={i}>
                  <span className="tick" aria-hidden>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="plan-cta">
              <a
                href={p.slug === "start" ? "/simulador" : "/login"}
                className="rc-btn rc-btn--green"
                aria-label={`${p.cta} — plano ${p.title}`}
              >
                {p.cta}
              </a>
            </div>
          </article>
        ))}
      </section>

      {/* CTA DOCK — SÓ NO MOBILE */}
      <aside className="ctaDock" aria-label="Ações rápidas de planos">
        <a href="/simulador" className="rc-btn rc-btn--green">Começar de graça</a>
        <a href="/login?plan=trader" className="rc-btn rc-btn--green">Quero ser Trader</a>
        <a href="/login?plan=pro" className="rc-btn rc-btn--green">Subir para Pro</a>
        <a href="/login?plan=elite" className="rc-btn rc-btn--green">Virar Elite</a>
      </aside>

      <style jsx>{`
        .page-planos {
          --w: min(1240px, 92vw);
          --glow: rgba(24, 226, 115, 0.18);
          --card-bg1: rgba(8, 24, 16, 0.55);
          --card-bg2: rgba(6, 18, 12, 0.45);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 18px 0 72px;
          gap: 18px;
        }

        .hero {
          position: relative;
          width: var(--w);
          text-align: center;
          margin-bottom: 6px; /* pequeno para ganhar espaço */
        }
        .hero h1 {
          font-size: clamp(26px, 3.2vw, 38px); /* um pouco menor p/ caber tudo */
          line-height: 1.05;
          margin: 0 0 10px 0;
          font-weight: 900;
          letter-spacing: 0.2px;
        }
        .hero h1 span {
          color: #18e273;
          text-shadow: 0 0 10px rgba(24, 226, 115, 0.8);
        }
        .hero .sub {
          margin: 0 auto 10px;
          max-width: 920px;
          font-size: clamp(14px, 1.4vw, 18px);
          opacity: 0.95;
        }

        .proofs {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: nowrap; /* cabe em uma linha */
          margin: 0 0 10px;
        }
        .proof {
          border: 1px solid rgba(24, 226, 115, 0.45);
          background: rgba(24, 226, 115, 0.12);
          color: #d8ffe9;
          font-weight: 700;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12.5px;
          white-space: nowrap;
        }

        .backTopRight {
          position: absolute;
          top: 0;
          right: 0;
        }

        /* GRID 4 COLUNAS — mais compacto */
        .plansGrid {
          width: var(--w);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px; /* gap menor */
          margin-top: 6px; /* sobe ~1–2 cm em média */
        }

        .plan {
          display: grid;
          grid-template-rows: auto 1fr auto;
          border-radius: 16px;
          padding: 14px; /* compacto */
          background: linear-gradient(180deg, var(--card-bg1) 0%, var(--card-bg2) 100%);
          box-shadow: inset 0 0 0 1px var(--glow), 0 16px 48px rgba(0, 0, 0, 0.35);
          min-height: 420px; /* ⬅️ menor que antes (cabem os CTAs no 100%) */
        }

        .plan-head {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          align-items: center;
          justify-items: start;
        }
        .ribbon {
          display: inline-flex;
          align-items: center;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(24, 226, 115, 0.18);
          border: 1px solid rgba(24, 226, 115, 0.45);
          color: #bfffd6;
          font-weight: 800;
          font-size: 11px; /* menor */
          letter-spacing: 0.3px;
          text-transform: uppercase;
          box-shadow: 0 0 10px rgba(24, 226, 115, 0.35) inset;
        }
        .plan-head h3 {
          margin: 0;
          font-weight: 900;
          font-size: 18px;
        }
        .price {
          margin-top: -2px;
          font-weight: 900;
          font-size: 18px; /* ligeiramente menor */
          color: #18e273;
          text-shadow: 0 0 8px rgba(24, 226, 115, 0.6);
        }

        .featList {
          list-style: none;
          margin: 8px 0 10px;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px; /* mais compacto */
        }
        .featList li {
          display: grid;
          grid-template-columns: 18px 1fr;
          align-items: center;
          min-height: 30px; /* ⬅️ compacta verticalmente */
          padding: 6px 10px;
          border-radius: 10px;
          border: 1px solid rgba(24, 226, 115, 0.16);
          background: rgba(24, 226, 115, 0.06);
          box-shadow: inset 0 0 0 1px rgba(24, 226, 115, 0.05);
        }
        .featList .tick {
          color: #18e273;
          font-weight: 900;
          margin-right: 6px;
        }

        .plan-cta {
          display: flex;
          justify-content: center;
          margin-top: 6px;
        }

        /* CTA Dock só no mobile */
        .ctaDock {
          position: sticky;
          bottom: 10px;
          display: none;
          z-index: 20;
          gap: 8px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(6px);
          border-radius: 14px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.32);
          width: calc(100% - 24px);
          margin: 0 auto;
          justify-content: space-between;
        }

        /* RESPONSIVO */
        @media (max-width: 1200px) {
          .plansGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 960px) {
          .proofs {
            flex-wrap: wrap; /* no mobile pode quebrar linha */
          }
          .plansGrid {
            grid-template-columns: 1fr;
          }
          .ctaDock {
            display: flex;
          }
        }
      `}</style>
    </main>
  );
}
