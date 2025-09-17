// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RadarCrypto — Simulador de Trading",
  description:
    "Aprenda de verdade sem perder nada. Um simulador prático para testar estratégias sem risco.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
