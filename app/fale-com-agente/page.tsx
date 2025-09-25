import Link from 'next/link';
import RadarBackground from '@/components/RadarBackground';

export default function FalePage() {
  return (
    <main style={{ position: 'relative', minHeight: '100dvh' }}>
      {/* Fundo animado */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.95 }}>
        <RadarBackground />
      </div>

      {/* Conteúdo */}
      <section
        className="panel"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1100,
          margin: '0 auto',
          padding: 18,
        }}
      >
        <header style={{ marginBottom: 16 }}>
          <div
            className="small muted"
            style={{
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Fale com a gente
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>
            Quer falar com nossa equipe?
          </h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Estamos finalizando os canais oficiais. Em breve você poderá chamar no WhatsApp
            ou enviar um e-mail para suporte.
          </p>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          {/* WhatsApp */}
          <div className="cardMini" style={{ background: 'rgba(0,0,0,.15)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,.08)' }}>
            <div className="small" style={{ fontWeight: 800, marginBottom: 6 }}>
              WhatsApp <span className="muted">(em breve)</span>
            </div>
            <p className="muted" style={{ marginTop: 0 }}>
              Atenderemos por WhatsApp Business assim que o número dedicado estiver ativo.
            </p>

            <div className="lbl" style={{ marginTop: 10 }}>Site:</div>
            <div className="inp inp-disabled" style={{ display: 'flex', alignItems: 'center' }}>
              radarcripto.space
            </div>

            <div style={{ marginTop: 12 }}>
              <button className="btn inp-disabled" disabled style={{ width: '100%' }}>
                Abrir WhatsApp
              </button>
            </div>
          </div>

          {/* E-mail */}
          <div className="cardMini" style={{ background: 'rgba(0,0,0,.15)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,.08)' }}>
            <div className="small" style={{ fontWeight: 800, marginBottom: 6 }}>
              E-mail <span className="muted">(em breve)</span>
            </div>
            <p className="muted" style={{ marginTop: 0 }}>
              Teremos um endereço <span style={{ fontWeight: 700 }}>@radarcripto.space</span> para suporte e dúvidas.
            </p>

            <div className="lbl" style={{ marginTop: 10 }}>Endereço</div>
            <div className="inp inp-disabled" style={{ display: 'flex', alignItems: 'center' }}>
              suporte@radarcripto.space
            </div>

            <div style={{ marginTop: 12 }}>
              <button className="btn inp-disabled" disabled style={{ width: '100%' }}>
                Enviar e-mail
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Voltar ao início — FIXO no canto superior direito */}
      <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 2 }}>
        <Link href="/" className="btn btn-primary">Voltar ao início</Link>
      </div>
    </main>
  );
}
