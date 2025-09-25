// app/fale/page.tsx
import Link from 'next/link';
import dynamic from 'next/dynamic';

// importa o Canvas apenas no cliente (sem SSR)
const RadarBackground = dynamic(
  () => import('@/components/RadarBackground'),
  { ssr: false }
);

export default function FalePage() {
  return (
    <main className="wrapperSingle">
      {/* container relativo para o canvas ficar por trás */}
      <div className="card withBg">
        {/* === FUNDO RADAR (Canvas) === */}
        <RadarBackground intensity={0.12} rotationSeconds={14} />

        {/* === CONTEÚDO (inalterado) === */}
        <h1 className="pageTitle">Fale com a gente</h1>
        <p className="muted" style={{ maxWidth: 720 }}>
          Quer falar com nossa equipe? Estamos finalizando os canais oficiais. Em breve você poderá
          chamar no WhatsApp ou enviar um e-mail.
        </p>

        <div className="contactGrid">
          <section className="contactCard">
            <h2 className="contactTitle">🟢 WhatsApp <small>(em breve)</small></h2>
            <p className="muted">
              Atenderemos por WhatsApp Business, assim que o número dedicado estiver ativo.
            </p>
            <div className="contactRow"><span className="muted">Site:</span> <strong>radarcrypto.space</strong></div>
            <div className="actions">
              <button className="btn" disabled>Abrir WhatsApp</button>
            </div>
          </section>

          <section className="contactCard">
            <h2 className="contactTitle">✉️ E-mail <small>(em breve)</small></h2>
            <p className="muted">
              Teremos um endereço <code>suporte@radarcrypto.space</code> para suporte e dúvidas.
            </p>
            <div className="actions">
              <button className="btn" disabled>Enviar e-mail</button>
            </div>
          </section>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Link href="/" className="btn btn-primary">Voltar ao início</Link>
        </div>
      </div>
    </main>
  );
}
