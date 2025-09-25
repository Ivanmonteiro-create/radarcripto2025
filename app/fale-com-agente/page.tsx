'use client';

import Link from 'next/link';
import RadarBackground from '@/components/RadarBackground';

export default function FalePage() {
  return (
    <main className="withBg" style={{ position: 'relative' }}>
      <RadarBackground />

      <header style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Link href="/" className="menuBtn">Voltar ao início</Link>
      </header>

      <h1 className="pageTitle">Fale com a gente</h1>
      <p className="muted" style={{ maxWidth: 680, marginBottom: 24 }}>
        Quer falar com nossa equipe? Estamos finalizando os canais oficiais. Em breve você poderá
        chamar no WhatsApp ou enviar um e-mail.
      </p>

      <div className="contactGrid">
        <section className="contactCard">
          <div className="contactTitle">WhatsApp (em breve)</div>
          <p className="muted small" style={{ marginTop: 6 }}>
            Atenderemos pelo WhatsApp Business; assim que o número dedicado estiver ativo, o botão
            ficará disponível aqui.
          </p>
          <button className="btn" disabled style={{ width: '100%', cursor: 'not-allowed', opacity: .65 }}>
            Abrir WhatsApp
          </button>
        </section>

        <section className="contactCard">
          <div className="contactTitle">E-mail (em breve)</div>
          <p className="muted small" style={{ marginTop: 6 }}>
            Teremos um endereço <strong>atendimento@radarcripto.space</strong> para suporte e dúvidas.
          </p>
          <button className="btn" disabled style={{ width: '100%', cursor: 'not-allowed', opacity: .65 }}>
            Enviar e-mail
          </button>
        </section>

        <section className="contactCard">
          <div className="contactTitle">Site</div>
          <p className="muted small" style={{ marginTop: 6 }}>
            <strong>radarcripto.space</strong>
          </p>
          <Link href="https://www.radarcripto.space" target="_blank" className="btn" style={{ width: '100%' }}>
            Abrir site
          </Link>
        </section>
      </div>
    </main>
  );
}
