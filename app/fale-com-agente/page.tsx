// app/fale-com-a-gente/page.tsx
"use client";

import React, { useState } from "react";

type Topic = "duvida" | "conta" | "outros";

export default function FaleComAGentePage() {
  // --- estado do formulário ---
  const [topic, setTopic] = useState<Topic>("duvida");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    // Simulação de envio local (substitua aqui pela sua API quando quiser)
    await new Promise((r) => setTimeout(r, 900));

    setSubmitting(false);
    setSent(true);
    // reseta a animação de sucesso após 2.2s
    setTimeout(() => setSent(false), 2200);
  }

  return (
    <main className="contact-page">
      {/* Botão fixo no topo-direito */}
      <a href="/" className="rc-btn rc-btn--green back-fixed" aria-label="Voltar ao início">
        Voltar ao início
      </a>

      {/* Cabeçalho */}
      <section className="hero">
        <h1>Fale com a gente</h1>
        <p className="lead">
          Dúvidas, sugestões ou parceria? Escreva pra gente pelo formulário. Respondemos, rápido.
        </p>
      </section>

      {/* Grid principal: Form (maior) + FAQ (menor) */}
      <section className="grid">
        {/* Coluna: Formulário */}
        <form className={`card form ${sent ? "form--sent" : ""}`} onSubmit={onSubmit}>
          <div className="card-title">Envie uma mensagem</div>

          <div className="fieldrow">
            <label className="label">Assunto</label>
            <div className="segmented">
              <button
                type="button"
                className={`seg ${topic === "duvida" ? "is-active" : ""}`}
                onClick={() => setTopic("duvida")}
              >
                Dúvida
              </button>
              <button
                type="button"
                className={`seg ${topic === "conta" ? "is-active" : ""}`}
                onClick={() => setTopic("conta")}
              >
                Conta
              </button>
              <button
                type="button"
                className={`seg ${topic === "outros" ? "is-active" : ""}`}
                onClick={() => setTopic("outros")}
              >
                Outros
              </button>
            </div>
          </div>

          <div className="fieldrow two">
            <div className="field">
              <label className="label">Seu nome</label>
              <input
                className="input"
                type="text"
                placeholder="Como devemos te chamar?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="label">E-mail</label>
              <input
                className="input"
                type="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="fieldrow">
            <label className="label">Mensagem</label>
            <textarea
              className="textarea"
              rows={6}
              placeholder="Conte em detalhes como podemos ajudar…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="actions">
            <button className="rc-btn rc-btn--green" disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar mensagem"}
            </button>

            {/* animação de sucesso */}
            <div className="sent-wrap" aria-live="polite" aria-atomic="true">
              {sent && (
                <div className="sent-badge">
                  <span className="dot" /> Enviado com sucesso!
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Coluna: FAQ / Atalhos */}
        <aside className="card faq">
          <div className="card-title">Dúvidas rápidas</div>

          <details className="qa">
            <summary>O simulador usa dados ao vivo?</summary>
            <p>Sim. No modo SIM, os preços são atualizados em tempo real no seu navegador.</p>
          </details>

          <details className="qa">
            <summary>Posso exportar meu histórico?</summary>
            <p>Sim. Use o botão <em>Exportar CSV</em> na página do simulador para baixar as operações.</p>
          </details>

          <details className="qa">
            <summary>Vocês têm WhatsApp?</summary>
            <p>Preferimos contato por e-mail, mas você pode iniciar por aqui e respondemos rápido.</p>
          </details>

          <details className="qa">
            <summary>Como migrar para um plano pago?</summary>
            <p>Vá em <strong>Planos</strong> e escolha o que faz sentido. A migração é instantânea.</p>
          </details>
        </aside>
      </section>

      {/* Estilos */}
      <style jsx>{`
        .contact-page {
          --w: min(1320px, 92vw); /* mais largo para caber em 100% */
          --gap: 22px;
          --radius: 16px;
          --panel-bg: linear-gradient(180deg, rgba(8, 24, 16, 0.55) 0%, rgba(6, 18, 12, 0.45) 100%);
          --stroke: rgba(24, 226, 115, 0.18);
          --glow: rgba(24, 226, 115, 0.75);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 18px 0 46px;
          isolation: isolate;
        }

        /* Botão fixo de voltar */
        .back-fixed {
          position: fixed;
          top: 18px;
          right: clamp(10px, 3vw, 28px);
          z-index: 20;
        }

        .hero {
          width: var(--w);
          margin: 10px 0 14px; /* menor para caber em 100% */
          text-align: center;
        }
        .hero h1 {
          font-size: clamp(28px, 3.4vw, 40px);
          margin: 0 0 6px 0;
          font-weight: 900;
          letter-spacing: 0.2px;
        }
        .hero .lead {
          opacity: 0.9;
          margin: 0 auto;
          max-width: 820px;
        }

        .grid {
          width: var(--w);
          display: grid;
          grid-template-columns: 1.25fr 0.75fr; /* form maior que FAQ */
          gap: var(--gap);
          align-items: start;
        }

        .card {
          background: var(--panel-bg);
          border-radius: 18px;
          box-shadow: inset 0 0 0 1px var(--stroke), 0 20px 60px rgba(0, 0, 0, 0.35);
          padding: 16px;
        }
        .card-title {
          font-weight: 800;
          margin: 2px 0 12px;
        }

        /* formulário */
        .form .fieldrow {
          margin-bottom: 12px;
        }
        .form .fieldrow.two {
          display: grid;
          gap: 12px;
          grid-template-columns: 1fr 1fr;
        }
        .label {
          font-size: 12px;
          opacity: 0.85;
          margin-bottom: 6px;
          display: block;
        }
        .input,
        .textarea {
          width: 100%;
          background: rgba(10, 30, 20, 0.6);
          border: 1px solid rgba(24, 226, 115, 0.25);
          border-radius: 12px;
          padding: 10px 12px;
          color: #e8fff3;
          outline: none;
          transition: box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .input:focus,
        .textarea:focus {
          border-color: rgba(24, 226, 115, 0.6);
          box-shadow: 0 0 0 3px rgba(24, 226, 115, 0.2);
        }

        .segmented {
          display: inline-flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .seg {
          background: rgba(10, 30, 20, 0.6);
          border: 1px solid rgba(24, 226, 115, 0.25);
          border-radius: 999px;
          padding: 8px 12px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.12s ease, filter 0.12s ease, border-color 0.12s ease;
        }
        .seg:hover {
          transform: translateY(-1px);
          filter: brightness(1.2);
          border-color: rgba(24, 226, 115, 0.5);
        }
        .seg.is-active {
          background: rgba(24, 226, 115, 0.18);
          border-color: rgba(24, 226, 115, 0.7);
          box-shadow: 0 0 14px rgba(24, 226, 115, 0.45);
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 6px;
          min-height: 40px;
        }
        .sent-wrap {
          min-width: 180px;
        }
        .sent-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(24, 226, 115, 0.14);
          border: 1px solid rgba(24, 226, 115, 0.4);
          box-shadow: 0 0 14px rgba(24, 226, 115, 0.35);
          animation: pop 220ms ease-out;
        }
        .sent-badge .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #18e273;
          box-shadow: 0 0 12px var(--glow);
          animation: pulse 1.2s ease-in-out infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.25); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }
        @keyframes pop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* FAQ */
        .faq .qa {
          background: rgba(10, 30, 20, 0.5);
          border: 1px solid rgba(24, 226, 115, 0.22);
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 10px;
        }
        .faq .qa summary {
          cursor: pointer;
          font-weight: 700;
          outline: none;
          list-style: none;
        }
        .faq .qa[open] {
          border-color: rgba(24, 226, 115, 0.55);
          box-shadow: 0 0 14px rgba(24, 226, 115, 0.35) inset;
        }
        .faq .qa p {
          margin: 8px 0 0;
          opacity: 0.9;
        }

        /* Botão base (mesmo visual global) */
        .rc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          padding: 0 20px;
          border-radius: 10px;
          font-weight: 800;
          text-decoration: none;
          line-height: 1;
          white-space: nowrap;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .rc-btn--green {
          background: #18e273 !important;
          color: #052515 !important;
          box-shadow: 0 0 18px rgba(24, 226, 115, 0.8), inset 0 0 10px rgba(24, 226, 115, 0.5);
        }
        .rc-btn--green:hover {
          filter: brightness(1.35);
          transform: translateY(-2px);
          box-shadow: 0 0 28px rgba(24, 226, 115, 1), inset 0 0 16px rgba(24, 226, 115, 0.7);
        }
        .rc-btn[disabled] {
          opacity: 0.65;
          cursor: not-allowed;
        }

        /* Responsivo */
        @media (max-width: 980px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .back-fixed {
            top: 12px;
          }
        }
      `}</style>

      {/* Decor: leve brilho radial de fundo */}
      <style jsx global>{`
        .contact-page::before {
          content: "";
          position: absolute;
          inset: -10% -5% auto -5%;
          height: 60%;
          background: radial-gradient(
            60% 60% at 50% 40%,
            rgba(24, 226, 115, 0.12),
            transparent 60%
          );
          pointer-events: none;
          z-index: -1;
          filter: blur(8px);
        }
      `}</style>
    </main>
  );
}
