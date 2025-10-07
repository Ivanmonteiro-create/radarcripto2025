// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "RadarCrypto — Fase 1",
  description: "Simulador de trading no navegador, histórico local. Fase 1.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="rc-root">
        {/* Barra flutuante global (client component) */}
        <NavBar />
        {children}
      </body>
    </html>
  );
}
