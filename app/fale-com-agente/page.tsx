'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

// importa o Radar (client) sem SSR
const RadarBackground = dynamic(() => import('@/components/RadarBackground'), {
  ssr: false,
});

export default function FalePage() {
  return (
    <main className="contactRoot">
      {/* Fundo animado (radar central) */}
      <div className="radarWrap">
        <RadarBackground size={760} beamAlpha={0.35} speed={0.015} />
      </div>

      {/* Botão fixo no topo direito */}
      <Link href="/" className="backBtn">Voltar ao início</Link>

      {/* Conteúdo */}
      <section className="panel contactPanel">
        <header className="contactHeader">
          <div className="eyebrow">Fale com a gente</div>
          <h1 className="title">Quer falar com nossa equipe?</h1>
          <p className="subtitle">
            Estamos finalizando os canais oficiais. Em breve você poderá chamar no WhatsApp
            ou enviar um e-mail para suporte.
          </p>
        </header>

        <div className="cards">
          {/* WhatsApp */}
          <article className="contactCard">
            <div className="cardHeader">
              <span className="pill">WhatsApp (em breve)</span>
            </div>
            <p className="cardText">
              Atenderemos por WhatsApp Business assim que o número dedicado estiver ativo.
            </p>

            <div className="field">
              <label className="label">Site:</label>
              <div className="fakeInput">radarcrypto.space</div>
            </div>

            <button className="btn" disabled>Abrir WhatsApp</button>
          </article>

          {/* E-mail */}
          <article className="contactCard">
            <div className="cardHeader">
              <span className="pill">E-mail (em breve)</span>
            </div>
            <p className="cardText">
              Teremos um endereço <strong>suporte@radarcrypto.space</strong> para suporte e dúvidas.
            </p>

            <div className="field">
              <label className="label">Endereço:</label>
              <div className="fakeInput">suporte@radarcrypto.space</div>
            </div>

            <button className="btn" disabled>Enviar e-mail</button>
          </article>
        </div>
      </section>

      {/* ====== estilos locais (styled-jsx) ====== */}
      <style jsx>{`
        .contactRoot{
          position:relative;
          min-height:100dvh;
          padding: 18px;
          overflow:hidden;
        }

        .radarWrap{
          position:absolute;
          inset:0;
          display:grid;
          place-items:center;
          z-index:0;
        }

        .backBtn{
          position: fixed;
          top: 16px;
          right: 18px;
          z-index: 3;
          text-decoration: none;
          background: linear-gradient(180deg, rgba(33,243,141,.22), rgba(33,243,141,.10));
          color: #1cff80;
          border: 1px solid rgba(33,243,141,.35);
          border-radius: 12px;
          padding: 10px 14px;
          font-weight: 800;
          box-shadow: 0 0 0 2px rgba(33,243,141,.14) inset;
        }
        .backBtn:hover{ filter: brightness(1.08); }

        .panel{
          position:relative;
          z-index:1;
          background: rgba(15, 21, 19, .82);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 16px;
          padding: 20px;
          max-width: 1080px;
          margin: 86px auto 32px;
          box-shadow: 0 0 0 1px rgba(33,243,141,.08) inset,
                      0 8px 28px rgba(0,0,0,.35);
        }

        .contactHeader{
          margin-bottom: 14px;
        }
        .eyebrow{
          color: rgba(255,255,255,.66);
          letter-spacing: .22em;
          text-transform: uppercase;
          font-size: 12px;
        }
        .title{
          margin: 6px 0 6px;
          font-size: clamp(22px, 4vw, 36px);
          line-height: 1.06;
          font-weight: 900;
          background: linear-gradient(180deg, #eafff5, #86ffbf);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 0 22px rgba(33,243,141,.12);
        }
        .subtitle{
          margin: 0;
          color: rgba(234, 255, 243, .92); /* ✅ texto mais claro */
        }

        .cards{
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 14px;
        }

        .contactCard{
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(33,243,141,.28);
          border-radius: 14px;
          padding: 14px;
          box-shadow: 0 0 0 1px rgba(33,243,141,.08) inset;
        }
        /* borda com leve brilho para “casar” com outras telas */
        .contactCard:hover{
          box-shadow:
            0 0 0 1px rgba(33,243,141,.18) inset,
            0 0 18px rgba(33,243,141,.10);
        }

        .cardHeader{ margin-bottom: 8px; }
        .pill{
          display:inline-block;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(33,243,141,.35);
          background: linear-gradient(180deg, rgba(33,243,141,.20), rgba(33,243,141,.08));
          color: #baffde;
          font-weight: 700;
          font-size: 12px;
        }
        .cardText{
          margin: 8px 0 12px;
          color: rgba(234,255,243,.92); /* ✅ texto mais claro */
        }

        .field{ margin-bottom: 10px; }
        .label{
          display:block;
          font-size: 12px;
          color: rgba(255,255,255,.66);
          margin-bottom: 4px;
        }
        .fakeInput{
          height: 38px;
          border-radius: 10px;
          display: grid;
          align-items: center;
          padding: 0 12px;
          background: rgba(255,255,255,.04);
          color: #eafff5; /* ✅ legível */
          border: 1px solid rgba(255,255,255,.12);
        }

        .btn{
          width: 100%;
          height: 40px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.18);
          background: rgba(255,255,255,.06);
          color: #e8fff5;
          font-weight: 700;
          cursor: not-allowed;
        }

        /* ===== Responsividade ===== */
        @media (max-width: 980px){
          .panel{ margin-top: 76px; }
          .cards{ grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
