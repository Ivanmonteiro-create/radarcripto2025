// app/layout.tsx
import "./globals.css";
import React from "react";

export const metadata = {
  title: "RadarCrypto",
  description: "RadarCrypto - Simulador e Radar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="rc-root">
        {/* aqui poderia ir um Header comum */}
        {children}
        {/* opcional Footer */}
      </body>
    </html>
  );
}
