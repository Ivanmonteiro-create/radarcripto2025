// app/planos/page.tsx
"use client";

import React from "react";

type Feature = { text: string; soon?: boolean };
type PlanCard = {
  id: "start" | "trader" | "pro" | "elite";
  title: string;
  badge?: string;
  price: string;
  cta: string;
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
      {/* Força esconder QUALQUER backtop legado à esquerda */}
      <style jsx global>{`
        .page-planos .rc-backtop,
        .page-planos .rc-backtop * {
          display: none !important;
        }
        /* Se vier um link raiz "/" do layout dentro da página, esconda (exceto o nosso botão fixo .backtop) */
        .page-planos a[href="/"]:not(.backtop) {
          display: none !important;
        }
      `}</style>

      {/* Botão fixo no canto superior direito */}
      <a href="/" className="rc-btn rc-btn--green backtop" aria-label="Voltar ao início">
        Voltar ao início
      </a>

      <header className="hero">
        <h1>
          Planos do <span>RadarCrypto</span>
        </h1>
        <p className="sub">
          Escolha seu caminho. Comece no SIM (simulador) sem riscos e evolua para
          gráficos, quando quiser, com robôs e ferramentas profissionais.
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
                  <span className="tick" aria-hidden>
                    ✓
                  </span>
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
        .page-planos {
          --fluor: #18e273;
          --fluorText: #052515;
          --panelW: min(1180px, 94vw); /* levemente menor para caber 2x2 sem rolar */
          --ring: rgba(24, 226, 115, 0.2);
          --glassTop: rgba(8, 24, 16, 0.55);
          --glassBot: rgba(6, 18, 12, 0.45);
          position: relative;
          min-height: 100%;
          padding: 18px 0 40px; /* mais compacto */
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        /* Botão fluorescente + posição fixa à direita */
        .backtop {
          position: fixed !important;
          top: 14px !important;
          right: 18px !important;
          z-index: 999 !important;
        }
        .rc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 34px;
          padding: 0 16px;
          border-radius: 12px;
          font-weight: 800;
          text-decoration: none;
          line-height: 1;
          border: 0;
          cursor: pointer;
          transition: transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease;
          white-space: nowrap;
        }
        .rc-btn--green {
          background: var(--fluor);
          color: var(--fluorText);
          box-shadow: 0 0 16px rgba(24, 226, 115, 0.8), inset 0 0 8px rgba(24, 226, 115, 0.5);
        }
        .rc-btn--green:hover {
          filter: brightness(1.35);
          transform: translateY(-2px);
          box-shadow: 0 0 24px rgba(24, 226, 115, 1), inset 0 0 14px rgba(24, 226, 115, 0.7);
        }

        /* Hero ainda mais enxuto */
        .hero {
          width: var(--panelW);
          text-align: center;
          padding-top: 4px;
        }
        .hero h1 {
          margin: 0 0 2px 0;
          font-size: clamp(24px, 2.8vw, 36px);
          font-weight: 900;
          letter-spacing: 0.2px;
        }
        .hero h1 span {
          color: var(--fluor);
          text-shadow: 0 0 10px rgba(24, 226, 115, 0.8);
        }
        .hero .sub {
          margin: 0 auto;
          max-width: 820px;
          opacity: 0.9;
          font-size: 13px;
        }

        /* Grid 2x2 com gaps menores */
        .grid {
          width: var(--panelW);
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (max-width: 980px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }

        /* Card compacto para caber 2 linhas sem scroll */
        .card {
          border-radius: 14px;
          padding: 8px 10px 8px;
          background: linear-gradient(180deg, var(--glassTop) 0%, var(--glassBot) 100%);
          box-shadow: inset 0 0 0 1px var(--ring), 0 16px 48px rgba(0, 0, 0, 0.32);
        }
        .card__topline {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 4px 8px;
          margin-bottom: 4px;
        }
        .badge {
          grid-column: 1 / -1;
          justify-self: start;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.4px;
          padding: 4px 8px;
          color: var(--fluorText);
          background: var(--fluor);
          border-radius: 999px;
          box-shadow: 0 0 12px rgba(24, 226, 115, 0.55);
        }
        .title {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
        }
        .price {
          justify-self: end;
          font-weight: 800;
          font-size: 12px;
          opacity: 0.95;
        }

        .features {
          list-style: none;
          margin: 6px 0 8px;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .features li {
          display: grid;
          grid-template-columns: 16px 1fr;
          align-items: start;
          gap: 6px;
          padding: 6px 8px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.02);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
          font-size: 13px;
          line-height: 1.2;
        }
        .tick {
          color: var(--fluor);
          font-weight: 900;
          text-shadow: 0 0 8px rgba(24, 226, 115, 0.8);
        }
        .soon .txt {
          opacity: 0.85;
        }
        .soonTag {
          font-style: normal;
          font-size: 11px;
          padding-left: 4px;
          color: var(--fluor);
        }

        .cta {
          display: flex;
          justify-content: flex-end;
          padding-top: 2px;
        }

        /* Tonalidades (mantidas) */
        .tone-recommended {
          box-shadow: inset 0 0 0 1px rgba(24, 226, 115, 0.32), 0 20px 58px rgba(0, 0, 0, 0.4);
        }
        .tone-pro {
          box-shadow: inset 0 0 0 1px rgba(24, 226, 115, 0.26), 0 20px 58px rgba(0, 0, 0, 0.38);
        }
        .tone-elite {
          box-shadow: inset 0 0 0 1px rgba(24, 226, 115, 0.36), 0 22px 62px rgba(0, 0, 0, 0.42);
        }

        /* Fallback extra compacto se a altura ainda for baixa */
        @media (max-height: 820px) {
          .page-planos {
            padding-top: 14px;
            gap: 12px;
          }
          .hero .sub {
            font-size: 12.5px;
          }
          .card {
            padding: 7px 8px 7px;
          }
          .features li {
            padding: 5px 7px;
            font-size: 12.5px;
          }
          .rc-btn {
            height: 32px;
            padding: 0 14px;
          }
        }
      `}</style>
    </main>
  );
}
