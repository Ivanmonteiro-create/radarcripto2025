"use client";

import React from "react";
import Link from "next/link";

export default function PlanosPage() {
  return (
    <main className="planos-container">
      {/* Botão fixo no topo direito */}
      <Link href="/" className="btn-voltar-fixo">Voltar ao início</Link>

      <h1 className="titulo-principal fade-in">
        Planos do <span className="verde">RadarCrypto</span>
      </h1>

      {/* 🔹 Frase de oferta (AOB) */}
      <p className="aob-offer fade-in-delay">
        Aprenda trading na prática, com as mesmas ferramentas dos traders reais —{" "}
        <strong>sem arriscar nada</strong>.
      </p>

      {/* 🔹 Microprovas de autoridade */}
      <section className="aob-microproofs slide-up">
        <div className="aob-proof">
          <span className="aob-ic">💬</span>
          <span>Mais de <strong>2.000</strong> traders já testaram</span>
        </div>
        <div className="aob-proof">
          <span className="aob-ic">🔒</span>
          <span>Dados 100% locais — <strong>segurança</strong> e <strong>privacidade</strong></span>
        </div>
        <div className="aob-proof">
          <span className="aob-ic">⚙️</span>
          <span>Ferramentas criadas por quem vive o mercado</span>
        </div>
      </section>

      {/* 🔹 Benefícios principais */}
      <section className="aob-benefits fade-in">
        <div className="aob-benefit">
          <span className="aob-dot" /> Ganhe <strong>confiança</strong> antes de colocar dinheiro real.
        </div>
        <div className="aob-benefit">
          <span className="aob-dot" /> Domine <strong>estratégias</strong> com resultados simulados em tempo real.
        </div>
        <div className="aob-benefit">
          <span className="aob-dot" /> Erre e aprenda <strong>sem perder</strong> — depois evolua com segurança.
        </div>
      </section>

      {/* 🔹 Frase padrão e grid dos planos */}
      <p className="subfrase fade-in">
        Escolha seu caminho. Comece no SIM (simulador) sem riscos e evolua para gráficos, quando quiser,
        com robôs e ferramentas profissionais.
      </p>

      <div className="grid-planos slide-up-delay">
        {/* START */}
        <div className="plano-card">
          <div className="plano-header">
            <span className="tag verde">PRONTO PARA COMEÇAR</span>
            <h2>Start</h2>
            <p className="preco">€ 0,00/mês</p>
          </div>
          <ul>
            <li>Simulador spot básico</li>
            <li>Capital virtual de 10.000 USDT</li>
            <li>PnL (resultado) e histórico básico</li>
            <li>Exportar CSV</li>
            <li>8 pares principais habilitados</li>
            <li>Gráfico de evolução mensal (equity) <em>em breve</em></li>
          </ul>
          <button className="btn verde">Começar de graça</button>
        </div>

        {/* TRADER */}
        <div className="plano-card">
          <div className="plano-header">
            <span className="tag verde">RECOMENDADO</span>
            <h2>Trader</h2>
            <p className="preco">€ 9,99/mês</p>
          </div>
          <ul>
            <li>Tudo do plano Start</li>
            <li>Robôs automáticos (EMA Cross SIM)</li>
            <li>Controle de risco manual (TP/SL)</li>
            <li>Histórico expandido (visual e CSV)</li>
            <li>Troca rápida entre pares</li>
            <li>Painel de performance resumida <em>em breve</em></li>
          </ul>
          <button className="btn verde">Quero ser Trader</button>
        </div>

        {/* PRO */}
        <div className="plano-card">
          <div className="plano-header">
            <span className="tag verde">TURBO ACELERADO</span>
            <h2>Pro</h2>
            <p className="preco">€ 19,99/mês</p>
          </div>
          <ul>
            <li>Tudo do plano Trader</li>
            <li>Gerenciamento de risco automático</li>
            <li>Relatórios filtráveis/detalhados</li>
            <li>Estatísticas avançadas (win rate, DD, etc.)</li>
            <li>Exportar relatórios detalhados</li>
            <li>Notificações de performance <em>em breve</em></li>
          </ul>
          <button className="btn verde">Subir para Pro</button>
        </div>

        {/* ELITE */}
        <div className="plano-card">
          <div className="plano-header">
            <span className="tag verde">TUDO DESEBLOQUEADO</span>
            <h2>Elite</h2>
            <p className="preco">€ 29,99/mês</p>
          </div>
          <ul>
            <li>Tudo do plano Pro</li>
            <li>Backtesting de estratégias</li>
            <li>Comparação de estratégias</li>
            <li>Histórico mensal/anual salvo (equity curves)</li>
            <li>Acesso antecipado a novidades (beta)</li>
            <li>Suporte prioritário + comunidade privada</li>
          </ul>
          <button className="btn verde">Virar Elite</button>
        </div>
      </div>

      <style jsx global>{`
        .planos-container {
          padding: 30px 20px 60px 20px;
          text-align: center;
          color: #dfffee;
          overflow-x: hidden;
        }

        .titulo-principal {
          font-size: clamp(22px, 3vw, 28px);
          font-weight: 700;
          margin-bottom: 8px;
        }

        .verde {
          color: #18e273;
        }

        .subfrase {
          font-size: clamp(14px, 1.4vw, 17px);
          opacity: 0.9;
          margin-top: 10px;
          margin-bottom: 24px;
        }

        .grid-planos {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 14px;
          justify-items: center;
          max-width: 1080px;
          margin: 0 auto;
        }

        .plano-card {
          background: rgba(10, 28, 18, 0.55);
          border: 1px solid rgba(24, 226, 115, 0.25);
          border-radius: 14px;
          padding: 12px 10px 16px 10px;
          text-align: left;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 390px;
          max-width: 250px;
          width: 100%;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .plano-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 0 10px rgba(24, 226, 115, 0.3);
        }

        .plano-header {
          text-align: center;
          margin-bottom: 8px;
        }

        .tag {
          font-size: 10px;
          border-radius: 8px;
          padding: 2px 8px;
          color: #0f1c11;
          background: #18e273;
          font-weight: 600;
        }

        .preco {
          color: #18e273;
          font-weight: 600;
          font-size: clamp(15px, 1.4vw, 18px);
          margin-top: 4px;
        }

        .plano-card ul {
          list-style: none;
          padding-left: 0;
          margin: 8px 0 14px 0;
        }

        .plano-card li {
          margin-bottom: 5px;
          font-size: 13px;
        }

        .btn.verde {
          background: #18e273;
          color: #0f1c11;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          padding: 8px 10px;
          cursor: pointer;
        }

        /* Botão fixo no topo direito */
        .btn-voltar-fixo {
          position: fixed;
          top: 20px;
          right: 24px;
          background: #18e273;
          color: #0f1c11;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 600;
          z-index: 999;
          transition: all 0.2s ease;
        }
        .btn-voltar-fixo:hover {
          background: #14c665;
        }

        /* ===== AOB ===== */
        .aob-offer {
          margin: 6px auto 16px auto;
          max-width: 940px;
          text-align: center;
          font-size: clamp(14px, 1.6vw, 18px);
          color: rgba(223, 255, 238, 0.92);
          text-shadow: 0 0 10px rgba(24, 226, 115, 0.18);
        }

        .aob-microproofs {
          margin: 16px auto 10px auto;
          max-width: 1000px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(8px, 1.6vw, 14px);
        }

        .aob-proof {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(10, 28, 18, 0.55);
          box-shadow: inset 0 0 0 1px rgba(24, 226, 115, 0.16);
          color: #dfffee;
          font-size: clamp(12px, 1.4vw, 15px);
        }

        .aob-benefits {
          margin: 10px auto 8px auto;
          max-width: 940px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
        }

        .aob-benefit {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #dfffee;
          font-size: clamp(13px, 1.5vw, 16px);
        }

        .aob-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #18e273;
          box-shadow: 0 0 8px rgba(24, 226, 115, 0.9);
        }

        /* ===== ANIMAÇÕES ===== */
        .fade-in {
          opacity: 0;
          animation: fadeIn 0.8s ease forwards;
        }

        .fade-in-delay {
          opacity: 0;
          animation: fadeIn 0.8s ease 0.3s forwards;
        }

        .slide-up {
          opacity: 0;
          transform: translateY(20px);
          animation: slideUp 0.8s ease forwards;
        }

        .slide-up-delay {
          opacity: 0;
          transform: translateY(25px);
          animation: slideUp 0.9s ease 0.3s forwards;
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 980px) {
          .aob-microproofs {
            grid-template-columns: 1fr;
          }
          .btn-voltar-fixo {
            top: 12px;
            right: 12px;
            padding: 6px 10px;
          }
        }
      `}</style>
    </main>
  );
}
