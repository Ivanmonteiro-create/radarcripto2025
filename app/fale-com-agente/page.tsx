// app/fale/page.tsx
"use client";

import React, { useState } from "react";

const WHATSAPP_LINK = "https://wa.me/5511999999999"; // <- TROCAR
const CONTACT_EMAIL = "contato@radarcrypto.space";   // <- TROCAR

type Topic =
  | "planos"
  | "pagamentos"
  | "bugs"
  | "sugestoes"
  | "parcerias"
  | "outros";

export default function FalePage() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    assunto: "outros" as Topic,
    mensagem: "",
    aceitaContato: true,
  });
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validateEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    setErr(null);

    if (!form.nome.trim()) return setErr("Informe seu nome.");
    if (!validateEmail(form.email)) return setErr("E-mail inválido.");
    if (!form.mensagem.trim() || form.mensagem.trim().length < 8)
      return setErr("Escreva uma mensagem (mín. 8 caracteres).");

    setSending(true);
    try {
      // Envio SIMULADO (grave aqui no futuro: /api/contato, Resend etc.)
      await new Promise((r) => setTimeout(r, 900));
      setOk("Mensagem enviada! Responderemos em breve.");
      setForm({
        nome: "",
        email: "",
        assunto: "outros",
        mensagem: "",
        aceitaContato: true,
      });
    } catch {
      setErr("Não foi possível enviar agora. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="page-fale">
      {/* Botão superior direito */}
      <div className="top-button">
        <a href="/" className="rc-btn rc-btn--green">Voltar ao início</a>
      </div>

      {/* Hero */}
      <section className="hero">
        <h1>Fale com a <span>gente</span></h1>
        <p className="sub">
          Dúvidas, sugestões ou parcerias? Escolha um canal abaixo ou envie sua
          mensagem pelo formulário. Respondemos rápido.
        </p>

        {/* Atalhos rápidos */}
        <div className="quick">
          <a className="rc-chip rc-chip--wa" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
            WhatsApp agora
          </a>
          <a className="rc-chip rc-chip--mail" href={`mailto:${CONTACT_EMAIL}`}>
            Enviar e-mail
          </a>
        </div>
      </section>

      {/* Grid principal */}
      <section className="grid">
        {/* Formulário */}
        <form className="card form" onSubmit={onSubmit} noValidate>
          <h2>Envie uma mensagem</h2>

          <label>
            <span>Seu nome</span>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => update("nome", e.target.value)}
              placeholder="Como devemos te chamar?"
              required
            />
          </label>

          <label>
            <span>E-mail</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="voce@email.com"
              required
            />
          </label>

          <label>
            <span>Assunto</span>
            <select
              value={form.assunto}
              onChange={(e) => update("assunto", e.target.value as Topic)}
            >
              <option value="planos">Planos e recursos</option>
              <option value="pagamentos">Pagamentos e faturas</option>
              <option value="bugs">Relatar bug/erro</option>
              <option value="sugestoes">Sugestões</option>
              <option value="parcerias">Parcerias</option>
              <option value="outros">Outros</option>
            </select>
          </label>

          <label className="full">
            <span>Mensagem</span>
            <textarea
              rows={6}
              value={form.mensagem}
              onChange={(e) => update("mensagem", e.target.value)}
              placeholder="Conte com detalhes como podemos ajudar…"
              required
            />
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={form.aceitaContato}
              onChange={(e) => update("aceitaContato", e.target.checked)}
            />
            <span>Você autoriza nosso contato por e-mail/WhatsApp?</span>
          </label>

          {err && <div className="alert alert--err">{err}</div>}
          {ok && <div className="alert alert--ok">{ok}</div>}

          <div className="actions">
            <button type="submit" className="rc-btn rc-btn--green" disabled={sending}>
              {sending ? "Enviando…" : "Enviar mensagem"}
            </button>
            <a className="rc-btn rc-btn--ghost" href={`mailto:${CONTACT_EMAIL}`}>
              Prefero e-mail
            </a>
          </div>
        </form>

        {/* FAQ / Ajuda rápida */}
        <div className="card faq">
          <h2>Dúvidas rápidas</h2>
          <details>
            <summary>O simulador usa dados reais?</summary>
            <p>Sim, o modo SIM utiliza dados em tempo real do mercado. Suas operações são locais (sem risco real).</p>
          </details>
          <details>
            <summary>Posso exportar meu histórico?</summary>
            <p>Sim. No simulador você encontra o botão <em>Exportar CSV</em> para baixar suas operações.</p>
          </details>
          <details>
            <summary>Qual plano preciso para usar robôs?</summary>
            <p>Os robôs (EMA Cross SIM) estão no plano Trader em diante. Você pode testar no SIM antes de assinar.</p>
          </details>
          <details>
            <summary>Como reporto um bug?</summary>
            <p>Use o assunto “Relatar bug/erro” no formulário ao lado e descreva os passos para reproduzir.</p>
          </details>
          <details>
            <summary>Vocês têm WhatsApp?</summary>
            <p>Sim! Clique em <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">WhatsApp agora</a> e nos chame.</p>
          </details>

          <div className="side-ctas">
            <a className="rc-chip rc-chip--wa" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">Chamar no Whats</a>
            <a className="rc-chip rc-chip--mail" href={`mailto:${CONTACT_EMAIL}`}>Enviar e-mail</a>
          </div>
        </div>
      </section>

      {/* Estilos locais */}
      <style jsx>{`
        .page-fale {
          --w: min(1200px, 92vw);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 28px 0 64px;
          color: #e6fff5;
          position: relative;
          isolation: isolate;
          background: radial-gradient(60% 60% at 50% 35%, rgba(24,226,115,0.10), transparent 65%);
        }

        .top-button {
          position: absolute;
          top: 18px;
          right: 28px;
          z-index: 10;
        }

        .rc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          padding: 0 18px;
          border-radius: 999px;
          font-weight: 800;
          text-decoration: none;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
          border: none;
          transition: transform .15s ease, box-shadow .15s ease, filter .15s ease;
        }
        .rc-btn--green {
          background: #18e273;
          color: #052515;
          box-shadow: 0 0 16px rgba(24,226,115,.8), inset 0 0 10px rgba(24,226,115,.4);
        }
        .rc-btn--green:hover { transform: translateY(-2px); box-shadow: 0 0 26px rgba(24,226,115,1), inset 0 0 12px rgba(24,226,115,.6); }
        .rc-btn--ghost { background: rgba(24,226,115,.12); color:#dbffef; border:1px solid rgba(24,226,115,.35); }
        .rc-btn--ghost:hover { filter: brightness(1.2); }

        .rc-chip {
          display:inline-flex; align-items:center; gap:8px;
          padding:8px 14px; border-radius:999px; font-weight:800;
          border:1px solid rgba(24,226,115,.45);
          background: rgba(24,226,115,.12);
          box-shadow: 0 0 12px rgba(24,226,115,.25);
        }
        .rc-chip--wa { }
        .rc-chip--mail { }

        .hero { width: var(--w); text-align:center; margin-top: 56px; }
        .hero h1 { font-size: clamp(28px, 4vw, 46px); font-weight:900; margin:0 0 8px; }
        .hero h1 span { color:#18e273; text-shadow:0 0 14px rgba(24,226,115,.8); }
        .hero .sub { max-width: 900px; margin: 0 auto; opacity:.95; }
        .quick { margin-top:14px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }

        .grid {
          width: var(--w);
          margin-top: 26px;
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          gap: 18px;
        }
        .card {
          border-radius: 16px;
          padding: 18px;
          background: rgba(12,28,20,.5);
          border:1px solid rgba(24,226,115,.22);
          backdrop-filter: blur(6px);
          box-shadow: inset 0 0 0 1px rgba(24,226,115,.08), 0 12px 30px rgba(0,0,0,.4);
        }
        .form h2, .faq h2 { margin: 0 0 10px; font-size: 20px; font-weight: 900; }

        .form label { display:flex; flex-direction:column; gap:6px; margin-top:10px; }
        .form label span { font-weight:700; font-size: 13.5px; color:#c9ffe6; }
        .form input, .form select, .form textarea {
          background: rgba(8,20,14,.6);
          border:1px solid rgba(24,226,115,.28);
          color:#eafff5;
          border-radius:10px;
          padding:10px 12px;
          outline:none;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .form input:focus, .form select:focus, .form textarea:focus {
          box-shadow: 0 0 0 3px rgba(24,226,115,.18);
          border-color: rgba(24,226,115,.55);
        }
        .form .check { flex-direction:row; align-items:center; gap:10px; margin-top:8px; }
        .form .full { grid-column: 1 / -1; }
        .actions { display:flex; gap:10px; margin-top:12px; flex-wrap:wrap; }

        .alert { margin-top:10px; padding:10px 12px; border-radius:10px; font-weight:700; }
        .alert--ok { background: rgba(24,226,115,.14); border:1px solid rgba(24,226,115,.45); color:#d8ffe9; }
        .alert--err { background: rgba(255,83,83,.12); border:1px solid rgba(255,83,83,.45); color:#ffdcdc; }

        .faq details { border:1px solid rgba(24,226,115,.22); border-radius:12px; padding:12px 14px; background: rgba(8,20,14,.5); margin-top:10px; }
        .faq summary { font-weight:800; cursor:pointer; }
        .faq p { margin:8px 0 0; opacity:.95; }
        .faq .side-ctas { display:flex; gap:10px; margin-top:12px; flex-wrap:wrap; }

        @media (max-width: 980px) {
          .grid { grid-template-columns: 1fr; }
          .top-button { position: static; display:flex; width:var(--w); justify-content:flex-end; margin-top:8px; }
          .hero { margin-top: 16px; }
        }
      `}</style>
    </main>
  );
}
