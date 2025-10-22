// app/robos/page.tsx
'use client';

import { useEffect } from 'react';

export default function RobosPage() {
  useEffect(() => {
    // Remove elementos de topo (tarja preta e link azul) ao montar a página
    const hideElements = () => {
      document
        .querySelectorAll('.rc-backtop, a.rc-btn.rc-btn--green[href="/"]')
        .forEach((el) => ((el as HTMLElement).style.display = 'none'));
    };
    hideElements();
    // Reaplica caso algo recarregue
    const observer = new MutationObserver(hideElements);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <main className="page-robos">
      <style>{`
        /* remove completamente a tarja preta e o botão azul antigo */
        .rc-backtop,
        a.rc-btn.rc-btn--green[href="/"] {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        /* botão verde novo dentro do painel direito */
        .btn-voltar-painel {
          position: absolute;
          top: 22px;
          right: 10px;
          z-index: 10;
          background: #18e273;
          color: #052515;
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 800;
          text-decoration: none;
          box-shadow: 0 0 0 1px rgba(0,255,128,.28), 0 8px 24px rgba(0,0,0,.35);
        }
        .btn-voltar-painel:hover {
          filter: brightness(1.07);
          transform: translateY(-1px);
        }

        /* ajusta o container do robô */
        .robot-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100dvh;
          flex-direction: column;
          position: relative;
          gap: 16px;
        }
        .robot-card {
          border: 1px solid rgba(255,255,255,.1);
          padding: 24px;
          border-radius: 12px;
          background: rgba(0,0,0,.25);
          width: 90%;
          max-width: 860px;
        }
      `}</style>

      <div className="robot-container">
        {/* Novo botão verde padrão RadarCrypto */}
        <a href="/" className="btn-voltar-painel">
          Voltar ao início
        </a>

        <div className="robot-card">
          <h1>Robôs de Trading (Modo Simulado)</h1>
          <p>
            Aqui você pode testar estratégias automatizadas em tempo real usando
            dados ao vivo. Este é o modo SIM (simulação local).
          </p>

          {/* Aqui permanece o conteúdo dos robôs já existente */}
          <div style={{ marginTop: '16px' }}>
            {/* Conteúdo do robô / componentes existentes */}
          </div>
        </div>
      </div>
    </main>
  );
}
