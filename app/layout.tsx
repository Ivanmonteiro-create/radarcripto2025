// app/layout.tsx
"use client";

import "./globals.css";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

function TopBarHome() {
  // barra superior só na Home (simulador, robôs, planos, sobre, fale)
  return (
    <header
      className="rc-topbar"
      role="navigation"
      aria-label="Atalhos principais"
    >
      <nav className="rc-topbar__nav">
        <Link href="/simulador" className="rc-btn">Simulador</Link>
        <Link href="/robos" className="rc-btn">Robôs (SIM)</Link>
        <Link href="/planos" className="rc-btn">Planos</Link>
        <Link href="/sobre" className="rc-btn">Sobre</Link>
        <Link href="/fale-com-agente" className="rc-btn">Fale com a gente</Link>
      </nav>
    </header>
  );
}

function BackHomeRight() {
  // botão único nas páginas internas
  return (
    <div className="rc-back-right">
      <Link href="/" className="rc-btn rc-btn--green">Voltar ao início</Link>
    </div>
  );
}

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <html lang="pt-BR">
      <body className="rc-root">
        {isHome ? <TopBarHome /> : <BackHomeRight />}
        {children}
      </body>
    </html>
  );
}
