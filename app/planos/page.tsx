// app/planos/page.tsx
"use client";

import React from "react";

/**
 * Página de Planos – RadarCrypto
 * - Mantém o layout atual (verde fluorescente)
 * - Sem dependências externas
 * - “Voltar ao início” no canto superior direito
 * - Nada de globais: estilos isolados via styled-jsx
 */

type Feature = {
  text: string;
  soon?: boolean; // marca “Em breve”
};

type PlanCard = {
  id: "start" | "trader" | "pro" | "elite";
  title: string;
  badge?: string;
  price: string; // ex: "€ 0,00 /mês"
  cta: string;   // texto do botão
  tone?: "primary" | "recommended" | "pro" | "elite";
  features: Feature[];
};

const PLANS: PlanCard[] = [
  {
    id: "start",
    title: "Start",
    badge: "PRONTO PARA COMEÇAR",
    price: "€ 0,00 /mês",
    cta: "Começar de graça",
    tone: "primary",
    features: [
      { text: "Simulador spot básico" },
      { text: "Capital virtual de 10.000 USDT" },
      { text: "PnL (resultado) e histórico básico" },
      { text: "Exportar CSV" },
      { text: "8 pares principais habilitados" },
      { text: "Gráfico de evolução mensal (equity)", soon: true },
    ],
  },
  {
    id: "trader",
    title: "Trader",
    badge: "RECOMENDADO",
    price: "€ 9,99 /mês",
    cta: "Quero ser Trader",
    tone: "recommended",
    features: [
      { text: "Tudo do plano Start" },
      { text: "Robôs automáticos (EMA Cross SIM)" },
      { text: "Controle de risco manual (TP/SL)" },
      { text: "Histórico expandido (visual e CSV)" },
      { text: "Troca rápida entre pares" },
      { text: "Painel de performance resumida", soon: true },
    ],
  },
  {
    id: "pro",
    title: "Pro",
    badge: "TURBO ACELERADOR",
    price: "€ 19,99 /mês",
    cta: "Subir para Pro",
    tone: "pro",
    features: [
      { text: "Tudo do plano Trader" },
      { text: "Gerenciamento de risco automático" },
      { text: "Relatórios filtráveis/detalhados" },
      { text: "Estatísticas avançadas (win rate, DD, etc.)" },
      { text: "Exportar relatórios detalhados" },
      { text: "Notificações de performance", soon: true },
    ],
  },
  {
    id: "elite",
    title: "Elite",
    badge: "TUDO DESEBLOQUEADO",
    price: "€ 29,99 /mês",
    cta: "Virar Elite",
    tone: "elite",
    features: [
      { text: "Tudo do plano Pro" },
      { text: "Backtesting de estratégias" },
      { text: "Comparação de estratégias" },
      { text: "Histórico mensal/anual salvo (equity curves)" },
      { text: "Acesso antecipado a novidades (beta)" },
      { text: "Suporte prioritário + comunidade privada" },
    ],
  },
];

export default function PlanosPage() {
  return (
    <main className="page-planos">
      {/* BOTÃO topo à direita */}
      <a href="/" className="rc-btn rc-btn--green backtop" aria-label="Voltar ao início">
        Voltar ao início
      </a>

      <header className="hero">
        <h1>
          Planos do <span>RadarCrypto</span>
        </h1>
        <p className="sub">
          Escolha seu caminho. Comece no SIM (simulador) sem riscos e evolua para gráficos,
          quando quiser, com robôs e ferramentas profissionais.
        </p>
      </header>

      <section className="grid">
        {PLANS.map((plan) => (
          <article key={plan.id} className={`card tone-${plan.tone || "primary"}`}>
            <div className="card__topline">
              {plan.badge && <span className="badge">{plan.badge}</span>}
              <h2 className="title">{plan.title}</h2>
              <div className="price">{plan.price}</div>
            </div>

            <ul className="features">
              {plan.features.map((f, i) => (
                <li key={i} className={f.soon ? "soon" : ""}>
                  <span className="tick" aria-hidden>✓</span>
                  <span className="txt">
                    {f.text} {f.soon && <em className="soonTag">• em breve</em>}
                  </span>
                </li>
              ))}
            </ul>

            <div className="cta">
              <button className="rc-btn rc-btn--green">{plan.cta}</button>
            </div>
          </article>
        ))}
      </section>

      <style jsx>{`
        /* Container base da página (não interfere em outras) */
        .page-planos {
          --fluor: #18e273;
          --fluorText: #052515;
          --panelW: min(1240px, 94vw);
          --ring: rgba(24, 226, 115, 0.2);
          --glassTop: rgba(8, 24, 16, 0.55);
          --glassBot: rgba(6, 18, 12, 0.45);

          position: relative;
          min-height: 100%;
          padding: 32px 0 72px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .backtop {
          position: absolute;
          top: 18px;
          right: 18px;
          z-index: 10;
        }

        /* Botões padrão fluorescentes (isolados aqui também) */
        .rc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          padding: 0 20px;
          border-radius: 12px;
          font-weight: 800;
          text-decoration: none;
          line-height: 1;
          border: 0;
          cursor: pointer;
          transition: transform .15s ease, filter .15s ease, box-shadow .15s ease;
          white-space: nowrap;
        }
        .rc-btn--green {
          background: var(--fluor);
          color: var(--fluorText);
          box-shadow:
            0 0 18px rgba(24, 226, 115, 0.8),
            inset 0 0 10px rgba(24, 226, 115, 0.5);
        }
        .rc-btn--green:hover {
          filter: brightness(1.35);
          transform: translateY(-2px);
          box-shadow:
            0 0 28px rgba(24, 226, 115, 1),
            inset 0 0 16px rgba(24, 226, 115, 0.7);
        }

        /* Hero */
        .hero {
          width: var(--panelW);
          text-align: center;
          padding-top: 12px;
        }
        .hero h1 {
          margin: 0 0 6px 0;
          font-size: clamp(28px, 3.6vw, 44px);
          font-weight: 900;
          letter-spacing: 0.2px;
        }
        .hero h1 span {
          color: var(--fluor);
          text-shadow: 0 0 10px rgba(24, 226, 115, 0.8);
        }
        .hero .sub {
          margin: 0 auto;
          max-width: 920px;
          opacity: 0.9;
        }

        /* Grid dos cards */
        .grid {
          width: var(--panelW);
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (max-width: 980px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }

        /* Card */
        .card {
          border-radius: 18px;
          padding: 16px 16px 14px;
          background: linear-gradient(180deg, var(--glassTop) 0%, var(--glassBot) 100%);
          box-shadow:
            inset 0 0 0 1px var(--ring),
            0 20px 60px rgba(0,0,0,0.35);
        }

        .card__topline {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 8px 12px;
          margin-bottom: 8px;
        }

        .badge {
          grid-column: 1 / -1;
          justify-self: start;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .4px;
          padding: 6px 10px;
          color: var(--fluorText);
          background: var(--fluor);
          border-radius: 999px;
          box-shadow: 0 0 14px rgba(24, 226, 115, .55);
        }

        .title {
          margin: 0;
          font-size: 22px;
          font-weight: 900;
        }
        .price {
          justify-self: end;
          font-weight: 800;
          opacity: .95;
        }

        /* Lista de features */
        .features {
          list-style: none;
          margin: 10px 0 14px;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .features li {
          display: grid;
          grid-template-columns: 22px 1fr;
          align-items: start;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(255,255,255,0.02);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
        }
        .features li .tick {
          color: var(--fluor);
          font-weight: 900;
          text-shadow: 0 0 10px rgba(24, 226, 115, 0.8);
        }
        .features li .txt {
          line-height: 1.2;
        }
        .features li.soon .txt {
          opacity: .8;
        }
        .soonTag {
          font-style: normal;
          font-size: 12px;
          padding-left: 4px;
          opacity: .9;
          color: var(--fluor);
        }

        .cta {
          display: flex;
          justify-content: flex-end;
          padding-top: 6px;
        }

        /* Tonalidades sutis por plano (bordas/brilhos) */
        .tone-recommended { box-shadow: inset 0 0 0 1px rgba(24,226,115,.32), 0 24px 72px rgba(0,0,0,.45); }
        .tone-pro          { box-shadow: inset 0 0 0 1px rgba(24,226,115,.26), 0 24px 72px rgba(0,0,0,.42); }
        .tone-elite        { box-shadow: inset 0 0 0 1px rgba(24,226,115,.36), 0 26px 76px rgba(0,0,0,.46); }
      `}</style>
    </main>
  );
}
