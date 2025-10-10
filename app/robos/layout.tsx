// app/robos/layout.tsx
import React from "react";

export const metadata = {
  title: "Robôs (SIM) — RadarCrypto",
  description:
    "Robôs de trading no modo SIM (simulação local). Teste estratégias com dados ao vivo, sem risco.",
};

export default function RobosLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="page-robos">
      {/* Shell central que define largura e centralização do conteúdo */}
      <div className="rc-robotsShell">
        {/* Botão verde, dentro do card, topo-direito (posicionado via CSS) */}
        <div className="rc-backtop">
          <a href="/" className="rc-btn rc-btn--green">Voltar ao início</a>
        </div>

        {children}
      </div>
    </main>
  );
}
