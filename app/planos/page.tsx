"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function PlanosPage() {
  const [showDock, setShowDock] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        setShowDock(!visible);
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll(".btn.verde").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="planos-container">
      <Link href="/" className="btn-voltar-fixo">Voltar ao início</Link>

      <h1 className="titulo-principal fade-in">
        Planos do <span className="verde">RadarCrypto</span>
      </h1>

      <p className="aob-offer fade-in-delay">
        Aprenda trading na prática, com as mesmas ferramentas dos traders reais —{" "}
        <strong>sem arriscar nada</strong>.
      </p>

      <section className="aob-microproofs slide-up">
        <div className="aob-proof">
          <span>💬</span> Mais de <strong>2.000</strong> traders já testaram
        </div>
        <div className="aob-proof">
          <span>🔒</span> Dados 100% locais — segurança e privacidade
        </div>
        <div className="aob-proof">
          <span>⚙️</span> Ferramentas criadas por quem vive o mercado
        </div>
      </section>

      <p className="subfrase fade-in">
        Escolha seu caminho. Comece no SIM (simulador) sem riscos e evolua para gráficos,
        quando quiser, com robôs e ferramentas profissionais.
      </p>

      <div className="grid-planos slide-up-delay">
        {[
          {
            nome: "Start",
            preco: "€ 0,00/mês",
            tag: "PRONTO PARA COMEÇAR",
            botoes: "Começar de graça",
            features: [
              "Simulador spot básico",
              "Capital virtual de 10.000 USDT",
              "PnL (resultado) e histórico básico",
              "Exportar CSV",
              "8 pares principais habilitados",
              "Gráfico de evolução mensal (equity) em breve",
            ],
          },
          {
            nome: "Trader",
            preco: "€ 9,99/mês",
            tag: "RECOMENDADO",
            botoes: "Quero ser Trader",
            features: [
              "Tudo do plano Start",
              "Robôs automáticos (EMA Cross SIM)",
              "Controle de risco manual (TP/SL)",
              "Histórico expandido (visual e CSV)",
              "Troca rápida entre pares",
              "Painel de performance resumida em breve",
            ],
          },
          {
            nome: "Pro",
            preco: "€ 19,99/mês",
            tag: "TURBO ACELERADO",
            botoes: "Subir para Pro",
            features: [
              "Tudo do plano Trader",
              "Gerenciamento de risco automático",
              "Relatórios filtráveis/detalhados",
              "Estatísticas avançadas (win rate, DD, etc.)",
              "Exportar relatórios detalhados",
              "Notificações de performance em breve",
            ],
          },
          {
            nome: "Elite",
            preco: "€ 29,99/mês",
            tag: "TUDO DESEBLOQUEADO",
            botoes: "Virar Elite",
            features: [
              "Tudo do plano Pro",
              "Backtesting de estratégias",
              "Comparação de estratégias",
              "Histórico mensal/anual salvo (equity curves)",
              "Acesso antecipado a novidades (beta)",
              "Suporte prioritário + comunidade privada",
            ],
          },
        ].map((plano) => (
          <div key={plano.nome} className="plano-card">
            <div className="plano-header">
              <span className="tag verde">{plano.tag}</span>
              <h2>{plano.nome}</h2>
              <p className="preco">{plano.preco}</p>
            </div>
            <ul>
              {plano.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button className="btn verde">{plano.botoes}</button>
          </div>
        ))}
      </div>

      {/* 🚀 Dock fixo com os 4 botões principais */}
      {showDock && (
        <div className="cta-dock">
          <button>Começar de graça</button>
          <button>Quero ser Trader</button>
          <button>Subir para Pro</button>
          <button>Virar Elite</button>
        </div>
      )}

      <style jsx global>{`
        .planos-container {
          padding: 24px 20px 80px 20px;
          text-align: center;
          color: #dfffee;
          overflow-x: hidden;
        }

        .titulo-principal {
          font-size: clamp(22px, 3vw, 28px);
          font-weight: 700;
          margin-bottom: 6px;
        }

        .verde {
          color: #18e273;
        }

        .subfrase {
          font-size: clamp(14px, 1.3vw, 16px);
          opacity: 0.9;
          margin: 8px auto 20px auto;
          max-width: 900px;
        }

        .grid-planos {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 12px;
          justify-items: center;
          max-width: 1000px;
          margin: 0 auto;
        }

        .plano-card {
          background: rgba(10, 28, 18, 0.55);
          border: 1px solid rgba(24, 226, 115, 0.25);
          border-radius: 12px;
          padding: 10px;
          text-align: left;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 360px;
          max-width: 240px;
          width: 100%;
        }

        .btn.verde {
          background: #18e273;
          color: #0f1c11;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          padding: 7px 10px;
          cursor: pointer;
        }

        /* Botão voltar fixo */
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

        /* Dock fixo de CTAs */
        .cta-dock {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          background: rgba(0, 10, 5, 0.8);
          display: flex;
          justify-content: center;
          gap: 12px;
          padding: 10px;
          border-top: 1px solid rgba(24, 226, 115, 0.25);
          backdrop-filter: blur(6px);
          z-index: 999;
          animation: fadeIn 0.4s ease forwards;
        }
        .cta-dock button {
          background: #18e273;
          color: #0f1c11;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          padding: 8px 14px;
          cursor: pointer;
        }
      `}</style>
    </main>
  );
}
