'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

const RadarBackground = dynamic(() => import('@/components/RadarBackground'), {
  ssr: false,
});

export default function FalePage() {
  return (
    <main className="contactRoot panel" style={{ position: 'relative' }}>
      {/* Botão no TOPO DIREITO */}
      <Link href="/" className="backTopRight btn btn-primary">
        Voltar ao início
      </Link>

      {/* Radar central, grande e brilhante */}
      <div className="radarLayer">
        <RadarBackground
          sectors={10}
          rings={6}
          sweepSpeed={1.05}
          beamWidthDeg={60}
          opacity={1}
        />
      </div>

      <div className="contactContent">
        <header className="contactHeader">
          <div className="eyebrow">FALE COM A GENTE</div>
          <h1 className="contactTitle">Quer falar com nossa equipe?</h1>
          <p className="contactSubtitle">
            Estamos finalizando os canais oficiais. Em breve você poderá chamar no WhatsApp
            ou enviar um e-mail para suporte.
          </p>
        </header>

        <div className="contactGrid">
          {/* WhatsApp */}
          <section className="contactCard">
            <div className="cardHead">
              <span className="badge badgeSoon">WhatsApp (em breve)</span>
            </div>
            <p className="cardText">
              Atenderemos por WhatsApp Business assim que o número dedicado estiver ativo.
            </p>
            <div className="field">
              <label className="lbl">Site:</label>
              <div className="fakeInput">radarcrypto.space</div>
            </div>
            <div className="actions">
              <button className="btn" disabled>
                Abrir WhatsApp
              </button>
            </div>
          </section>

          {/* E-mail */}
          <section className="contactCard">
            <div className="cardHead">
              <span className="badge badgeSoon">E-mail (em breve)</span>
            </div>
            <p className="cardText">
              Teremos um endereço <strong>suporte@radarcrypto.space</strong> para suporte e dúvidas.
            </p>
            <div className="field">
              <label className="lbl">Endereço:</label>
              <div className="fakeInput">suporte@radarcrypto.space</div>
            </div>
            <div className="actions">
              <button className="btn" disabled>
                Enviar e-mail
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
