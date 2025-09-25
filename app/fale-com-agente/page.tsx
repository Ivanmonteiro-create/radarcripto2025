// app/fale-com-a-gente/page.tsx
'use client';

import Link from 'next/link';
import RadarBackground from '@/components/RadarBackground';

export default function FalePage() {
  return (
    <main
      className="panel"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        overflow: 'hidden',
        padding: 16,
      }}
    >
      {/* ===== BACKGROUND – Radar central ===== */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.9,
        }}
      >
        <RadarBackground />
      </div>

      {/* ===== BOTÃO VOLTAR AO INÍCIO (topo direito) ===== */}
      <div
        style={{
          position: 'sticky',
          top: 8,
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 2,
        }}
      >
        <Link
          href="/"
          className="btn btn-primary"
          style={{
            borderRadius: 12,
            padding: '10px 14px',
            fontWeight: 800,
          }}
        >
          Voltar ao início
        </Link>
      </div>

      {/* ===== CONTEÚDO ===== */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1120,
          margin: '24px auto 0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {/* Título/lead (coluna direita para ficar com respiro do radar) */}
        <div style={{ gridColumn: '1 / span 2' }}>
          <div
            style={{
              color: 'var(--muted)',
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            Fale com a gente
          </div>

          <h1
            style={{
              margin: 0,
              fontWeight: 900,
              fontSize: 'clamp(22px, 4.5vw, 44px)',
              lineHeight: 1.06,
              textShadow: '0 0 16px rgba(33,243,141,.20)',
            }}
          >
            Quer falar com nossa equipe?
          </h1>

          <p
            style={{
              margin: '8px 0 20px',
              maxWidth: 720,
              color: '#cfeedd',
              opacity: 0.92,
              fontSize: 15,
            }}
          >
            Estamos finalizando os canais oficiais. Em breve você poderá chamar no WhatsApp
            ou enviar um e-mail para suporte.
          </p>
        </div>

        {/* ===== Card WhatsApp ===== */}
        <div
          className="cardMini"
          style={{
            background: 'rgba(0,0,0,.18)',
            borderRadius: 14,
            padding: 14,
            border: '1px solid var(--accent)',
            boxShadow:
              '0 0 0 3px rgba(33,243,141,.12) inset, 0 0 22px rgba(33,243,141,.12)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 800,
                  color: 'var(--accent-strong)',
                  marginBottom: 2,
                }}
              >
                WhatsApp (em breve)
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                Atenderemos pelo WhatsApp Business assim que o número dedicado estiver ativo.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            <label className="lbl">Site:</label>
            <input className="inp inp-disabled" disabled value="radarcripto.space" />
            <button className="btn" disabled style={{ fontWeight: 700 }}>
              Abrir WhatsApp
            </button>
          </div>
        </div>

        {/* ===== Card E-mail ===== */}
        <div
          className="cardMini"
          style={{
            background: 'rgba(0,0,0,.18)',
            borderRadius: 14,
            padding: 14,
            border: '1px solid var(--accent)',
            boxShadow:
              '0 0 0 3px rgba(33,243,141,.12) inset, 0 0 22px rgba(33,243,141,.12)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 800,
                  color: 'var(--accent-strong)',
                  marginBottom: 2,
                }}
              >
                E-mail (em breve)
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                Teremos um endereço <em>@radarcripto.space</em> para suporte e dúvidas.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            <label className="lbl">Endereço:</label>
            <input
              className="inp inp-disabled"
              disabled
              value="suporte@radarcripto.space"
            />
            <button className="btn" disabled style={{ fontWeight: 700 }}>
              Enviar e-mail
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
