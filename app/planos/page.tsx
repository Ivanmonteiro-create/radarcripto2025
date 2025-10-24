// app/planos/page.tsx
"use client";

import React from "react";

type Feature = { text: string; soon?: boolean };
type Plan = {
  id: "start" | "trader" | "pro" | "elite";
  title: string;
  price: string; // ex: "€ 0,00/mês"
  ribbon?: "RECOMENDADO" | "PRONTO PARA COMEÇAR" | "TURBO ACELERADO" | "TUDO DESBLOQUEADO";
  features: Feature[];
  cta: { label: string; href: string; aria: string };
  mutedRibbon?: boolean; // deixa ribbon levemente opaco p/ não concorrer com “RECOMENDADO”
};

const PLANS: Plan[] = [
  {
    id: "start",
    title: "Start",
    price: "€ 0,00/mês",
    ribbon: "PRONTO PARA COMEÇAR",
    mutedRibbon: true,
    features: [
      { text: "Simulador spot básico" },
      { text: "Capital virtual de 10.000 USDT" },
      { text: "PnL (resultado) e histórico básico" },
      { text: "Exportar CSV" },
      { text: "8 pares principais habilitados" },
      { text: "Gráfico de evolução mensal (equity)", soon: true },
    ],
    cta: { label: "Começar de graça", href: "/simulador", aria: "Assinar plano Start — gratuito" },
  },
  {
    id: "trader",
    title: "Trader",
    price: "€ 9,99/mês",
    ribbon: "RECOMENDADO",
    features: [
      { text: "Tudo do plano Start" },
      { text: "Robôs automáticos (EMA Cross SIM)" },
      { text: "Controle de risco manual (TP/SL)" },
      { text: "Histórico expandido (visual e CSV)" },
      { text: "Troca rápida entre pares" },
      { text: "Painel de performance resumida", soon: true },
    ],
    cta: { label: "Quero ser Trader", href: "/simulador", aria: "Assinar plano Trader — 9,99 €/mês" },
  },
  {
    id: "pro",
    title: "Pro",
    price: "€ 19,99/mês",
    ribbon: "TURBO ACELERADO",
    mutedRibbon: true,
    features: [
      { text: "Tudo do plano Trader" },
      { text: "Gerenciamento de risco automático" },
      { text: "Relatórios filtráveis/detalhados" },
      { text: "Estatísticas avançadas (win rate, DD, etc.)" },
      { text: "Exportar relatórios detalhados" },
      { text: "Notificações de performance", soon: true },
    ],
    cta: { label: "Subir para Pro", href: "/simulador", aria: "Assinar plano Pro — 19,99 €/mês" },
  },
  {
    id: "elite",
    title: "Elite",
    price: "€ 29,99/mês",
    ribbon: "TUDO DESBLOQUEADO",
    mutedRibbon: true,
    features: [
      { text: "Tudo do plano Pro" },
      { text: "Backtesting de estratégias" },
      { text: "Comparação de estratégias" },
      { text: "Histórico mensal/anual salvo (equity curves)" },
      { text: "Acesso antecipado a novidades (beta)" },
      { text: "Suporte prioritário + comunidade privada" },
    ],
    cta: { label: "Virar Elite", href: "/simulador", aria: "Assinar plano Elite — 29,99 €/mês" },
  },
];

export default function PlanosPage() {
  return (
    <main className="page-planos">
      {/* Botão verde no topo direito */}
      <a href="/" className="rc-btn rc-btn--green backTop" aria-label="Voltar ao início">
        Voltar ao início
      </a>

      <section className="hero">
        <h1>
          Planos do <span>RadarCrypto</span>
        </h1>
        <p className="sub">
          Escolha seu caminho. Comece no SIM (simulador) sem riscos e evolua para gráficos, quando
          quiser, com robôs e ferramentas profissionais.
        </p>

        {/* Provas sociais */}
        <div className="proof">
          <div className="proofCard">
            <strong>+2.000 traders</strong> já testaram
          </div>
          <div className="proofCard">
            <strong>100% local</strong> e seguro
          </div>
          <div className="proofCard">
            Ferramentas de <strong>quem vive o mercado</strong>
          </div>
        </div>
      </section>

      {/* Grid dos quatro planos */}
      <section className="plansGrid" aria-label="Planos disponíveis">
        {PLANS.map((p) => (
          <article key={p.id} className="planCard" aria-labelledby={`${p.id}-title`}>
            {p.ribbon && (
              <div className={`ribbon ${p.mutedRibbon ? "ribbon--muted" : ""}`}>{p.ribbon}</div>
            )}

            <header className="planHead">
              <h3 id={`${p.id}-title`}>{p.title}</h3>
              <div className="price" aria-label={`Preço do plano ${p.title}`}>{p.price}</div>
            </header>

            <ul className="featList">
              {p.features.map((f, idx) => (
                <li key={idx} className="feat">
                  <span className="tick" aria-hidden>✔</span>
                  <span className="txt">
                    {f.text}
                    {f.soon && <em className="soon"> · em breve</em>}
                  </span>
                </li>
              ))}
            </ul>

            <footer className="planCta">
              <a
                href={p.cta.href}
                className="rc-btn rc-btn--green ctaBtn"
                aria-label={p.cta.aria}
              >
                {p.cta.label}
              </a>
            </footer>
          </article>
        ))}
      </section>

      {/* Estilos locais + micro ajustes */}
      <style jsx>{`
        .page-planos {
          --maxw: min(1200px, 92vw);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 28px 0 72px;
          gap: 16px;
        }

        .backTop {
          position: absolute;
          top: 16px;
          right: 18px;
          z-index: 10;
        }

        .hero {
          width: var(--maxw);
          text-align: center;
          margin-top: 18px;
        }
        .hero h1 {
          font-size: clamp(26px, 3.4vw, 40px); /* ligeiramente menor p/ ganhar espaço */
          line-height: 1.08;
          margin: 0 0 6px 0;
          font-weight: 900;
          letter-spacing: 0.2px;
        }
        .hero h1 span {
          color: #18e273;
          text-shadow: 0 0 10px rgba(24, 226, 115, 0.75);
        }
        .hero .sub {
          margin: 0 auto 14px;
          max-width: 980px;
          font-size: clamp(14px, 1.65vw, 17px);
          color: rgba(223, 255, 238, 0.95); /* + contraste */
          text-shadow: 0 1px 0 rgba(0, 0, 0, 0.25);
        }

        .proof {
          width: var(--maxw);
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin: 8px auto 14px; /* levemente mais perto do título */
        }
        .proofCard {
          border: 1px solid rgba(24, 226, 115, 0.45);
          background: rgba(24, 226, 115, 0.08);
          border-radius: 12px;
          padding: 10px 12px;
          font-weight: 600;
          text-align: center;
          box-shadow: inset 0 0 0 1px rgba(24, 226, 115, 0.15);
        }

        .plansGrid {
          width: var(--maxw);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-top: 6px;  /* aproximado da faixa de provas sociais */
        }

        .planCard {
          position: relative;
          border-radius: 16px;
          padding: 14px 14px 12px;
          background: linear-gradient(180deg, rgba(8, 24, 16, 0.55) 0%, rgba(6, 18, 12, 0.45) 100%);
          box-shadow:
            inset 0 0 0 1px rgba(24, 226, 115, 0.18),
            0 12px 40px rgba(0, 0, 0, 0.35);
        }

        .ribbon {
          position: absolute;
          top: -12px;
          right: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #18e273;
          color: #052515;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.3px;
          box-shadow: 0 0 14px rgba(24, 226, 115, 0.9);
        }
        .ribbon--muted { opacity: 0.85; } /* Start/Pro/Elite ficam um pouco mais sutis */

        .planHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 6px;
        }
        .planHead h3 {
          margin: 0;
          font-size: clamp(16px, 1.9vw, 18px);
          font-weight: 900;
        }
        .price {
          font-weight: 900;
          font-size: clamp(14px, 1.7vw, 16px);
          color: #18e273;
          text-shadow: 0 0 8px rgba(24, 226, 115, 0.8);
          white-space: nowrap;
        }

        .featList {
          list-style: none;
          padding: 0;
          margin: 0 0 10px 0;
          display: grid;
          gap: 8px;
        }
        .feat {
          display: grid;
          grid-template-columns: 18px 1fr;
          align-items: start;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(24, 226, 115, 0.06);
          border: 1px solid rgba(24, 226, 115, 0.22);
        }
        .tick { opacity: 0.9; }
        .txt { font-size: 13.5px; line-height: 1.25; }
        .soon { font-style: italic; font-size: 12.5px; opacity: 0.85; } /* 1px menor e em itálico */

        .planCta {
          display: flex;
          justify-content: center;
          margin-top: 6px;
        }
        .ctaBtn {
          min-width: 160px;
          transition: transform 120ms ease, filter 150ms ease, box-shadow 150ms ease;
        }
        .ctaBtn:hover { transform: translateY(-1px); filter: brightness(1.12); }
        .ctaBtn:active { transform: scale(0.98); } /* “press” suave */

        /* Responsivo */
        @media (max-width: 1024px) {
          .plansGrid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .proof { grid-template-columns: 1fr; }
          .plansGrid { grid-template-columns: 1fr; }
          .backTop { top: 12px; right: 12px; }
        }
        @media (max-width: 360px) {
          .proofCard { font-size: 13px; }
          .hero .sub { font-size: 14px; }
        }
      `}</style>

      {/* Botão base (verde fluorescente) — caso o projeto não tenha essas utilitárias globalmente */}
      <style jsx global>{`
        .rc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          padding: 0 18px;
          border-radius: 999px;
          font-weight: 900;
          text-decoration: none;
          line-height: 1;
          white-space: nowrap;
          border: none;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .rc-btn--green {
          background: #18e273 !important;
          color: #052515 !important;
          box-shadow: 0 0 18px rgba(24, 226, 115, 0.85),
                      inset 0 0 10px rgba(24, 226, 115, 0.5);
        }
        .rc-btn--green:hover {
          filter: brightness(1.2);
          transform: translateY(-1px);
          box-shadow: 0 0 26px rgba(24, 226, 115, 1),
                      inset 0 0 14px rgba(24, 226, 115, 0.7);
        }
      `}</style>
    </main>
  );
}
