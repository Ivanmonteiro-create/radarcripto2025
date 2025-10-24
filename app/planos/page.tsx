"use client";

import React from "react";
import Link from "next/link";

export default function PlanosPage() {
  return (
    <main className="planos-container">
      <h1 className="titulo-principal">Planos do <span className="verde">RadarCrypto</span></h1>

      {/* 🔹 BLOCO AOB - Oferta (logo abaixo do título) */}
      <p className="aob-offer">
        Aprenda trading na prática, com as mesmas ferramentas dos traders reais —{" "}
        <strong>sem arriscar nada</strong>.
      </p>

      {/* Frase original já existente */}
      <p className="subfrase">
        Escolha seu caminho. Comece no SIM (simulador) sem riscos e evolua para gráficos, quando quiser,
        com robôs e ferramentas profissionais.
      </p>

      {/* 🔹 GRID DOS PLANOS (mantido igual ao seu layout atual) */}
      <div className="grid-planos">
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

      {/* 🔹 BLOCO AOB - Autoridade (microprovas) */}
      <section className="aob-microproofs" aria-label="Provas de confiança">
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

      {/* 🔹 BLOCO AOB - Benefícios emocionais */}
      <section className="aob-benefits" aria-label="Benefícios principais">
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

      {/* Botão voltar */}
      <div className="voltar-container">
        <Link href="/" className="btn-voltar">Voltar ao início</Link>
      </div>

      {/* 🔹 ESTILOS INLINE (você pode mover depois para globals.css se quiser) */}
      <style jsx global>{`
        .planos-container {
          padding: 40px 24px 60px 24px;
          text-align: center;
          color: #dfffee;
        }

        .titulo-principal {
          font-size: clamp(22px, 3vw, 28px);
          font-weight: 700;
        }

        .verde {
          color: #18e273;
        }

        .subfrase {
          font-size: clamp(14px, 1.4vw, 17px);
          opacity: 0.9;
          margin-top: 8px;
          margin-bottom: 30px;
        }

        .grid-planos {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 18px;
          justify-items: center;
          max-width: 1100px;
          margin: 0 auto 24px auto;
        }

        .plano-card {
          background: rgba(10, 28, 18, 0.55);
          border: 1px solid rgba(24, 226, 115, 0.25);
          border-radius: 14px;
          padding: 16px 12px 20px 12px;
          text-align: left;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 420px;
          width: 100%;
          max-width: 260px;
        }

        .plano-header {
          text-align: center;
          margin-bottom: 10px;
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
          margin: 8px 0 16px 0;
        }

        .plano-card li {
          margin-bottom: 5px;
          font-size: 13px;
        }

        .plano-card em {
          color: #aaa;
          font-style: normal;
          font-size: 12px;
        }

        .btn {
          border: none;
          border-radius: 10px;
          padding: 8px 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn.verde {
          background: #18e273;
          color: #0f1c11;
        }

        .btn-voltar {
          display: inline-block;
          margin-top: 20px;
          background: #18e273;
          color: #0f1c11;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 600;
        }

        .voltar-container {
          margin-top: 25px;
        }

        /* ===== BLOCO AOB ===== */
        .aob-offer {
          margin: 10px auto 14px auto !important;
          max-width: 980px;
          text-align: center;
          font-size: clamp(14px, 1.6vw, 18px);
          line-height: 1.45;
          color: rgba(223, 255, 238, 0.92);
          text-shadow: 0 0 10px rgba(24, 226, 115, 0.18);
        }

        .aob-microproofs {
          margin: 20px auto 8px auto !important;
          max-width: 1100px;
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
          line-height: 1.35;
        }

        .aob-ic {
          filter: saturate(1.2) drop-shadow(0 0 6px rgba(24, 226, 115, 0.35));
        }

        .aob-benefits {
          margin: 6px auto 0 auto !important;
          max-width: 980px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .aob-benefit {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #dfffee;
          font-size: clamp(13px, 1.5vw, 16px);
          line-height: 1.45;
          opacity: 0.95;
        }

        .aob-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #18e273;
          box-shadow: 0 0 8px rgba(24, 226, 115, 0.9);
          display: inline-block;
          flex: 0 0 auto;
        }

        @media (max-width: 980px) {
          .aob-microproofs {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
