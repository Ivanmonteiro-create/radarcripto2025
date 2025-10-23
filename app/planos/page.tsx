// app/planos/page.tsx
"use client";

import React, { useEffect } from "react";

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
  // Remove qualquer botão “Voltar ao início” antigo
  useEffect(() => {
    const links = Array.from(document.querySelectorAll("a"));
    links.forEach((a) => {
      const text = (a.textContent || "").trim().toLowerCase();
      if (text === "voltar ao início" && !(a as HTMLElement).id.includes("backtop-planos")) {
        (a as HTMLElement).style.display = "none";
      }
    });
    const bars = document.querySelectorAll(".rc-backtop");
    bars.forEach((el) => ((el as HTMLElement).style.display = "none"));
  }, []);

  return (
    <main className="page-planos">
      <style jsx global>{`
        .page-planos .rc-backtop { display: none !important; }
        .page-planos a.rc-btn.rc-btn--green[aria-label="Voltar ao início"] {
          display: none !important;
        }
        .page-planos #backtop-planos { display: inline-flex !important; }
      `}</style>

      <a
        id="backtop-planos"
        href="/"
        className="rc-btn rc-btn--green backtop"
        aria-label="Voltar ao início"
      >
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

      <section className="row4">
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
        .page-planos {
          --fluor: #18e273;
          --fluorText: #052515;
          --ring: rgba(24, 226, 115, 0.2);
          --glassTop: rgba(8, 24, 16, 0.55);
          --glassBot: rgba(6, 18, 12, 0.45);
          --panelW: min(1420px, 98vw);
          position: relative;
          padding: 18px 0 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        .backtop {
          position: fixed;
          top: 14px;
          right: 18px;
          z-index: 999;
        }

        .row4 {
          width: var(--panelW);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          align-items: start;
        }

        .card {
          border-radius: 14px;
          padding: 14px;
          background: linear-gradient(180deg, var(--glassTop) 0%, var(--glassBot) 100%);
          box-shadow: inset 0 0 0 1px var(--ring), 0 16px 48px rgba(0,0,0,.32);
        }

        .features li {
          font-size: 14.5px;
          line-height: 1.35;
          padding: 10px 12px;
          margin-bottom: 4px;
          border-radius: 12px;
          background: rgba(255,255,255,.03);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.06);
        }
      `}</style>
    </main>
  );
} // ✅ ← ESTE FECHA O COMPONENTE
