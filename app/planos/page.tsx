// app/planos/page.tsx
"use client";

import React from "react";

export default function PlanosPage() {
  return (
    <main className="page-planos">
      {/* ---------- Ajustes globais só desta página ---------- */}
      <style jsx global>{`
        /* Esconde a tarja/toolbar antiga de back (se existir) */
        .rc-backtop,
        .rc-backtop * {
          display: none !important;
        }

        /* Botão padrão verde fluorescente RadarCrypto */
        .rc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          padding: 0 18px;
          border-radius: 10px;
          font-weight: 800;
          line-height: 1;
          text-decoration: none;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 0.15s ease, filter 0.15s ease,
            box-shadow 0.2s ease;
        }
        .rc-btn--green {
          background: #18e273 !important;
          color: #052515 !important;
          box-shadow: 0 0 18px rgba(24, 226, 115, 0.8),
            inset 0 0 10px rgba(24, 226, 115, 0.5);
        }
        .rc-btn--green:hover {
          filter: brightness(1.35);
          transform: translateY(-2px);
          box-shadow: 0 0 28px rgba(24, 226, 115, 1),
            inset 0 0 16px rgba(24, 226, 115, 0.7);
        }
        .rc-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.2px;
          color: #caffee;
          background: rgba(24, 226, 115, 0.12);
          border: 1px solid rgba(24, 226, 115, 0.3);
          text-transform: uppercase;
        }
        .rc-badge--soon {
          background: rgba(255, 212, 0, 0.12);
          border-color: rgba(255, 212, 0, 0.35);
          color: #ffeaa3;
        }
      `}</style>

      {/* ---------- Cabeçalho ---------- */}
      <section className="hero">
        <h1 className="rc-title">
          Planos do <span>RadarCrypto</span>
        </h1>
        <p className="rc-sub">
          Escolha seu caminho. Comece no <strong>SIM</strong> com dados ao vivo,
          evolua para relatórios e, quando quiser, automatize com os robôs. Sem
          pressa, passo a passo.
        </p>

        {/* Botão no topo direito (fixo dentro do hero) */}
        <div className="backBtn">
          <a href="/" className="rc-btn rc-btn--green">Voltar ao início</a>
        </div>
      </section>

      {/* ---------- Grid de Planos ---------- */}
      <section className="grid">
        {/* START */}
        <article className="card">
          <header className="card-head">
            <div className="pill">Plano de Entrada</div>
            <h2>Start</h2>
            <div className="price">€ 0,00 <span>/ mês</span></div>
          </header>
          <ul className="features">
            <li>Simulador Spot básico</li>
            <li>Capital inicial: <strong>10.000 USDT</strong></li>
            <li>Exportação <strong>CSV</strong> dos trades</li>
            <li><strong>PnL</strong> (lucro/prejuízo) em tempo real</li>
            <li>Indicadores configuráveis (EMA e outros)</li>
            <li>
              <span className="rc-badge rc-badge--soon">em breve</span>
              &nbsp;Evolução de performance (gráficos históricos)
            </li>
          </ul>
          <footer className="card-foot">
            <a href="/simulador" className="rc-btn rc-btn--green">Começar de graça</a>
          </footer>
        </article>

        {/* TRADER */}
        <article className="card">
          <header className="card-head">
            <div className="pill pill--promo">Recomendado</div>
            <h2>Trader</h2>
            <div className="price">€ 9,99 <span>/ mês</span></div>
          </header>
          <ul className="features">
            <li>Tudo do plano <strong>Start</strong></li>
            <li>Histórico <strong>expandido</strong> de operações</li>
            <li><strong>PnL</strong> realista com atualização ao vivo</li>
            <li>Indicadores personalizados e <strong>8 pares</strong></li>
            <li>
              <span className="rc-badge rc-badge--soon">em breve</span>
              &nbsp;Relatórios comparativos e filtros avançados
            </li>
          </ul>
          <footer className="card-foot">
            <a href="/simulador" className="rc-btn rc-btn--green">Quero ser Trader</a>
          </footer>
        </article>

        {/* PRO */}
        <article className="card">
          <header className="card-head">
            <div className="pill">Turbo Acelerador</div>
            <h2>Pro</h2>
            <div className="price">€ 19,99 <span>/ mês</span></div>
          </header>
          <ul className="features">
            <li>Tudo do plano <strong>Trader</strong></li>
            <li>Análise gráfica integrada (<strong>TradingView</strong>)</li>
            <li>
              <span className="rc-badge rc-badge--soon">em dev</span>
              &nbsp;Gerenciamento de risco automático
            </li>
            <li>
              <span className="rc-badge rc-badge--soon">em breve</span>
              &nbsp;Relatórios detalhados e estatísticas por período
            </li>
          </ul>
          <footer className="card-foot">
            <a href="/simulador" className="rc-btn rc-btn--green">Subir para Pro</a>
          </footer>
        </article>

        {/* ELITE */}
        <article className="card">
          <header className="card-head">
            <div className="pill pill--vip">Tudo Desbloqueado</div>
            <h2>Elite</h2>
            <div className="price">€ 29,99 <span>/ mês</span></div>
          </header>
          <ul className="features">
            <li>Tudo do plano <strong>Pro</strong></li>
            <li>Robôs de trading (<strong>modo SIM</strong>) operacionais</li>
            <li>
              <span className="rc-badge rc-badge--soon">em dev</span>
              &nbsp;Backtesting de estratégias
            </li>
            <li>Acesso antecipado a versões <strong>VIP</strong> e novas ferramentas</li>
          </ul>
          <footer className="card-foot">
            <a href="/robos" className="rc-btn rc-btn--green">Virar Elite</a>
          </footer>
        </article>
      </section>

      {/* ---------- Estilos locais ---------- */}
      <style jsx>{`
        .page-planos {
          --w: min(1240px, 92vw);
          --gap: clamp(16px, 2.4vw, 28px);
          padding: 28px 0 64px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .hero {
          position: relative;
          width: var(--w);
          text-align: center;
        }
        .rc-title {
          margin: 0 0 8px;
          font-size: clamp(28px, 3.6vw, 44px);
          font-weight: 900;
          letter-spacing: 0.2px;
        }
        .rc-title span {
          color: #18e273;
          text-shadow: 0 0 10px rgba(24, 226, 115, 0.8);
        }
        .rc-sub {
          margin: 0 auto 8px;
          max-width: 900px;
          opacity: 0.9;
        }
        .backBtn {
          position: absolute;
          top: 0;
          right: 0;
        }

        .grid {
          width: var(--w);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--gap);
        }
        @media (max-width: 1100px) {
          .grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 680px) {
          .grid { grid-template-columns: 1fr; }
        }

        .card {
          border-radius: 16px;
          padding: 18px;
          background: radial-gradient(
              120% 120% at 100% 0%,
              rgba(24, 226, 115, 0.06) 0%,
              rgba(0, 0, 0, 0) 60%
            ),
            rgba(9, 20, 15, 0.55);
          box-shadow: inset 0 0 0 1px rgba(24, 226, 115, 0.16),
            0 18px 40px rgba(0, 0, 0, 0.35);
        }
        .card-head {
          display: grid;
          grid-template-columns: 1fr auto;
          grid-template-areas:
            "pill price"
            "title price";
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .card-head .pill {
          grid-area: pill;
          justify-self: start;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid rgba(24, 226, 115, 0.35);
          background: rgba(24, 226, 115, 0.12);
          color: #caffee;
          font-weight: 800;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .pill--promo { background: rgba(0, 180, 255, 0.14); border-color: rgba(0,180,255,0.35); }
        .pill--vip   { background: rgba(255, 212, 0, 0.14);  border-color: rgba(255,212,0,0.35); }

        .card-head h2 {
          grid-area: title;
          margin: 0;
          font-size: 22px;
          font-weight: 900;
        }
        .card-head .price {
          grid-area: price;
          justify-self: end;
          font-size: 22px;
          font-weight: 900;
        }
        .card-head .price span {
          font-size: 12px;
          font-weight: 700;
          opacity: 0.8;
        }

        .features {
          list-style: none;
          padding: 0;
          margin: 0 0 14px;
          display: grid;
          gap: 8px;
          font-size: 14px;
        }
        .features li {
          padding-left: 18px;
          position: relative;
        }
        .features li::before {
          content: "✓";
          position: absolute;
          left: 0;
          top: 0;
          color: #18e273;
          text-shadow: 0 0 8px rgba(24, 226, 115, 0.9);
        }

        .card-foot { display: flex; justify-content: flex-end; }
      `}</style>
    </main>
  );
}
