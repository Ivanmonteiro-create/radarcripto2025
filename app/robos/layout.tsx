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
      {/* Shell central desta rota */}
      <div className="rc-robotsShell">
        {/* ÚNICO botão de voltar desta página (verde, canto direito) */}
        <div className="rc-backtop rc-backtop--robos">
          <a href="/" className="rc-btn rc-btn--green">Voltar ao início</a>
        </div>

        {/* Conteúdo atual da página Robôs */}
        {children}
      </div>
    </main>
  );
}
