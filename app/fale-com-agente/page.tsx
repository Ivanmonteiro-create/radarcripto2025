// app/fale-com-a-gente/page.tsx
"use client";

import React, { useMemo, useState } from "react";

type Topic = "duvida" | "conta" | "outros";

const WA_ENV = process.env.NEXT_PUBLIC_WHATSAPP || ""; // ex.: 351912345678 (DDI+DDD+NÚMERO)

export default function FaleComAGentePage() {
  const [topic, setTopic] = useState<Topic>("duvida");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const waReady = useMemo(() => /^\d{9,15}$/.test(WA_ENV), []);
  const waHref = useMemo(() => {
    if (!waReady) return undefined;
    const txt = encodeURIComponent(
      `Olá RadarCrypto! Vim do site.\nAssunto: ${topic.toUpperCase()}\nMeu nome: ${name || "—"}\nE-mail: ${email || "—"}`
    );
    return `https://wa.me/${WA_ENV}?text=${txt}`;
  }, [topic, name, email, waReady]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900)); // simulação
    setSubmitting(false);
    setSent(true);
    setTimeout(() => setSent(false), 2200);
  }

  return (
    <main className="contact-page">
      {/* Botão fixo topo-direito (ID exclusivo para não ser afetado por estilos globais antigos) */}
      <a id="rc-backtop" href="/" aria-label="Voltar ao início" className="rc-btn rc-btn--green back-fixed">
        Voltar ao início
      </a>

      {/* Cabeçalho */}
      <section className="hero">
        <h1>Fale com a gente</h1>
        <p className="lead">
          Dúvidas, sugestões ou parceria? Escreva pra gente pelo formulário — ou chame no WhatsApp.
        </p>
      </section>

      {/* Grid */}
      <section className="grid">
        {/* Formulário (mais compacto) */}
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
              rows={5}
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

            {/* WhatsApp com mesmo brilho fluorescente */}
            <a
              className={`rc-btn rc-btn--green rc-btn--whatsapp ${waReady ? "" : "is-disabled"}`}
              href={waHref}
              target={waReady ? "_blank" : undefined}
              rel={waReady ? "noopener" : undefined}
              aria-disabled={!waReady}
              title={waReady ? "Abrir conversa no WhatsApp" : "Configure NEXT_PUBLIC_WHATSAPP"}
            >
              <span className="wa-ico" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.52 3.48A11.94 11.94 0 0012 0C5.37 0 0 5.37 0 12c0 2.11.55 4.11 1.6 5.9L0 24l6.3-1.63A11.96 11.96 0 0012 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.22-3.48-8.52zM12 22a9.93 9.93 0 01-5.08-1.39l-.36-.21-3.76.97.99-3.66-.24-.38A9.97 9.97 0 1122 12c0 5.52-4.48 10-10 10zm5.55-7.45c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.8-1.49-1.78-1.66-2.08-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.6-.48-.5-.67-.5-.17 0-.37-.02-.57-.02-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.5 0 1.48 1.06 2.91 1.21 3.11.15.2 2.1 3.2 5.09 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.27-.2-.57-.35z"/>
                </svg>
              </span>
              Chamar no WhatsApp
            </a>

            <div className="sent-wrap" aria-live="polite" aria-atomic="true">
              {sent && (
                <div className="sent-badge">
                  <span className="dot" /> Enviado com sucesso!
                </div>
              )}
            </div>
          </div>
        </form>

        {/* FAQ */}
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
            <p>Clique em <strong>Chamar no WhatsApp</strong> ao lado do botão de envio do formulário.</p>
          </details>

          <details className="qa">
            <summary>Como migrar para um plano pago?</summary>
            <p>Vá em <strong>Planos</strong> e escolha o que faz sentido. A migração é instantânea.</p>
          </details>
        </aside>
      </section>

      {/* Estilos locais (ajustes para caber em 100%) */}
      <style jsx>{`
        .contact-page {
          --w: min(1240px, 92vw); /* levemente menor */
          --gap: 18px;
          --panel-bg: linear-gradient(180deg, rgba(8, 24, 16, 0.55) 0%, rgba(6, 18, 12, 0.45) 100%);
          --stroke: rgba(24, 226, 115, 0.18);
          --glow: rgba(24, 226, 115, 0.75);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 14px 0 42px; /* topo/rodapé menores */
          isolation: isolate;
        }

        /* botão fixo topo-direito */
        #rc-backtop.back-fixed {
          position: fixed;
          top: 14px;
          right: clamp(10px, 3vw, 28px);
          z-index: 9999;
          display: inline-flex !important;
        }

        .hero {
          width: var(--w);
          margin: 6px 0 10px;
          text-align: center;
        }
        .hero h1 {
          font-size: clamp(26px, 3vw, 36px); /* menor */
          margin: 0 0 4px 0;
          font-weight: 900;
          letter-spacing: 0.2px;
        }
        .hero .lead {
          opacity: 0.9;
          margin: 0 auto;
          max-width: 820px;
          font-size: 0.98rem;
        }

        .grid {
          width: var(--w);
          display: grid;
          grid-template-columns: 1.2fr 0.8fr; /* form levemente maior */
          gap: var(--gap);
          align-items: start;
        }

        .card {
          background: var(--panel-bg);
          border-radius: 16px;         /* menor */
          box-shadow: inset 0 0 0 1px var(--stroke), 0 16px 48px rgba(0, 0, 0, 0.35);
          padding: 14px;               /* menor */
        }
        .card-title {
          font-weight: 800;
          margin: 2px 0 10px;
        }

        .form .fieldrow { margin-bottom: 10px; }
        .form .fieldrow.two {
          display: grid;
          gap: 10px;
          grid-template-columns: 1fr 1fr;
        }

        .label { font-size: 11px; opacity: 0.85; margin-bottom: 5px; display: block; }

        .input, .textarea {
          width: 100%;
          background: rgba(10, 30, 20, 0.6);
          border: 1px solid rgba(24, 226, 115, 0.25);
          border-radius: 10px;         /* menor */
          padding: 9px 11px;           /* menor */
          color: #e8fff3;
          outline: none;
          transition: box-shadow .15s ease, border-color .15s ease;
          font-size: 0.97rem;
        }
        .input:focus, .textarea:focus {
          border-color: rgba(24, 226, 115, 0.6);
          box-shadow: 0 0 0 3px rgba(24, 226, 115, 0.2);
        }

        .segmented { display: inline-flex; gap: 8px; flex-wrap: wrap; }
        .seg {
          background: rgba(10, 30, 20, 0.6);
          border: 1px solid rgba(24, 226, 115, 0.25);
          border-radius: 999px;
          padding: 7px 11px;           /* menor */
          font-weight: 700;
          cursor: pointer;
          transition: transform .12s ease, filter .12s ease, border-color .12s ease;
        }
        .seg:hover { transform: translateY(-1px); filter: brightness(1.2); border-color: rgba(24, 226, 115, 0.5); }
        .seg.is-active {
          background: rgba(24, 226, 115, 0.18);
          border-color: rgba(24, 226, 115, 0.7);
          box-shadow: 0 0 14px rgba(24, 226, 115, 0.45);
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
          min-height: 38px; /* um pouco menor */
          flex-wrap: wrap;
        }

        /* Botões globais */
        .rc-btn {
          display: inline-flex; align-items: center; justify-content: center;
          height: 36px;                      /* menor */
          padding: 0 14px;                   /* menor */
          border-radius: 10px;
          font-weight: 800; text-decoration: none; line-height: 1; white-space: nowrap;
          border: none; cursor: pointer; transition: all .2s ease;
        }
        .rc-btn--green {
          background: #18e273 !important; color: #052515 !important;
          box-shadow: 0 0 18px rgba(24,226,115,.8), inset 0 0 10px rgba(24,226,115,.5);
        }
        .rc-btn--green:hover {
          filter: brightness(1.35); transform: translateY(-2px);
          box-shadow: 0 0 28px rgba(24,226,115,1), inset 0 0 16px rgba(24,226,115,.7);
        }
        /* WhatsApp reaproveita o mesmo brilho e apenas mantém o ícone */
        .rc-btn--whatsapp .wa-ico { display: inline-flex; margin-right: 8px; }
        .rc-btn--whatsapp.is-disabled { opacity: .55; cursor: not-allowed; pointer-events: none; }

        .sent-wrap { min-width: 176px; }
        .sent-badge {
          display: inline-flex; align-items: center; gap: 8px;
          font-weight: 800; padding: 7px 10px; border-radius: 999px;
          background: rgba(24, 226, 115, 0.14);
          border: 1px solid rgba(24, 226, 115, 0.4);
          box-shadow: 0 0 14px rgba(24, 226, 115, 0.35);
          animation: pop 220ms ease-out;
        }
        .sent-badge .dot {
          width: 9px; height: 9px; border-radius: 999px; background: #18e273;
          box-shadow: 0 0 12px var(--glow); animation: pulse 1.2s ease-in-out infinite;
        }
        @keyframes pulse { 0%{transform:scale(1);opacity:.9} 50%{transform:scale(1.25);opacity:1} 100%{transform:scale(1);opacity:.9} }
        @keyframes pop { 0%{transform:scale(.9);opacity:0} 100%{transform:scale(1);opacity:1} }

        /* FAQ */
        .faq .qa {
          background: rgba(10, 30, 20, 0.5);
          border: 1px solid rgba(24, 226, 115, 0.22);
          border-radius: 12px;
          padding: 11px 13px;            /* menor */
          margin-bottom: 9px;
          font-size: 0.97rem;
        }
        .faq .qa summary { cursor: pointer; font-weight: 700; outline: none; list-style: none; }
        .faq .qa[open] { border-color: rgba(24, 226, 115, 0.55); box-shadow: inset 0 0 14px rgba(24, 226, 115, 0.35); }
        .faq .qa p { margin: 7px 0 0; opacity: 0.9; }

        /* Responsivo */
        @media (max-width: 980px) {
          .grid { grid-template-columns: 1fr; }
          #rc-backtop.back-fixed { top: 10px; }
        }
        /* Botão WhatsApp — agora com mesmo brilho e animação do botão Enviar mensagem */
.rc-btn--whatsapp {
  background: #18e273 !important;
  color: #052515 !important;
  box-shadow: 0 0 18px rgba(24, 226, 115, 0.8), inset 0 0 10px rgba(24, 226, 115, 0.5);
  transition: all 0.2s ease;
}
.rc-btn--whatsapp:hover {
  filter: brightness(1.35);
  transform: translateY(-2px);
  box-shadow: 0 0 28px rgba(24, 226, 115, 1), inset 0 0 16px rgba(24, 226, 115, 0.7);
}
      `}</style>

      {/* Glow radial suave no fundo */}
      <style jsx global>{`
        .contact-page::before {
          content: "";
          position: absolute;
          inset: -10% -5% auto -5%;
          height: 58%;
          background: radial-gradient(60% 60% at 50% 40%, rgba(24, 226, 115, 0.12), transparent 60%);
          pointer-events: none;
          z-index: -1;
          filter: blur(8px);
        }
      `}</style>
    </main>
  );
}
