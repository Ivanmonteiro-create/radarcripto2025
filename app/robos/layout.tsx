// app/robos/layout.tsx
import React from "react";
import BackHomeButton from "./BackHomeButton";

export const metadata = {
  title: "Robôs de Trading (Modo Simulado) | RadarCrypto",
  description: "Teste estratégias automatizadas de trading em modo simulado.",
};

export default function RobosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {/* Botão fixo no canto superior direito, só nesta rota (/robos) */}
        <BackHomeButton />

        {/* Conteúdo principal da página */}
        {children}
      </body>
    </html>
  );
}
